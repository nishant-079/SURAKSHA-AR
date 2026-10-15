from fastapi import FastAPI, APIRouter, HTTPException, Query, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import random
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import bcrypt
from jose import jwt, JWTError

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="SURAKSHA AR")
api_router = APIRouter(prefix="/api")

PASS_THRESHOLD = int(os.environ.get("PASS_THRESHOLD", "70"))
ORG_NAME = "SURAKSHA AR — Vocational Safety Training"
ADMIN_ID = os.environ.get("ADMIN_ID", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Suraksha@2026")
JWT_SECRET = os.environ.get("JWT_SECRET", "suraksha-dev-secret")
JWT_MINUTES = int(os.environ.get("JWT_MINUTES", "720"))
ALGORITHM = "HS256"
bearer = HTTPBearer(auto_error=False)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ------------------------- Models -------------------------
class UserCreate(BaseModel):
    name: str
    workerId: str
    password: str
    language: str = "en"
    ageGroup: Optional[str] = None
    sector: Optional[str] = None
    organization: Optional[str] = None


class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    workerId: str
    language: str = "en"
    ageGroup: Optional[str] = None
    sector: Optional[str] = None
    organization: Optional[str] = None
    createdAt: str = Field(default_factory=now_iso)


class AttemptCreate(BaseModel):
    userId: str
    workerName: Optional[str] = None
    moduleId: str
    moduleTitle: Optional[str] = None
    score: int
    correct: int
    total: int
    passed: bool
    durationSec: Optional[int] = 0
    language: Optional[str] = "en"


class CertificateCreate(BaseModel):
    userId: str
    name: str
    workerId: Optional[str] = None
    moduleId: str
    moduleTitle: str
    score: int
    language: Optional[str] = "en"


class AdminLoginIn(BaseModel):
    id: str
    password: str
class UserLoginIn(BaseModel):
    workerId: str
    password: str    


# ------------------------- Helpers -------------------------
def clean(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc = {k: v for k, v in doc.items() if k != "_id"}
    return doc


async def next_cert_id() -> str:
    count = await db.certificates.count_documents({})
    seq = 124 + count  # start near demo sample for credibility
    year = datetime.now(timezone.utc).year
    return f"JH-SAFE-{year}-{seq:06d}"


# ------------------------- Admin Auth -------------------------
async def seed_admin() -> None:
    hashed = bcrypt.hashpw(ADMIN_PASSWORD.encode(), bcrypt.gensalt()).decode()
    await db.admins.update_one(
        {"adminId": ADMIN_ID},
        {"$set": {"adminId": ADMIN_ID, "passwordHash": hashed, "role": "admin"}},
        upsert=True,
    )


def issue_admin_token(admin_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": admin_id, "role": "admin", "iat": now, "exp": now + timedelta(minutes=JWT_MINUTES)}
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)
def issue_user_token(user_id: str, worker_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "workerId": worker_id,
        "role": "worker",
        "iat": now,
        "exp": now + timedelta(minutes=JWT_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)

async def require_admin(creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer)):
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired admin session",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not creds or creds.scheme.lower() != "bearer":
        raise unauthorized
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[ALGORITHM])
        if payload.get("role") != "admin" or not payload.get("sub"):
            raise unauthorized
    except (JWTError, ValueError):
        raise unauthorized
    return payload["sub"]


@api_router.post("/admin/login")
async def admin_login(body: AdminLoginIn):
    admin = await db.admins.find_one({"adminId": body.id.strip()})
    stored = admin["passwordHash"] if admin else bcrypt.hashpw(b"dummy-password", bcrypt.gensalt()).decode()
    valid = bcrypt.checkpw(body.password.encode(), stored.encode())
    if not admin or not valid:
        raise HTTPException(status_code=401, detail="Invalid ID or password")
    return {"access_token": issue_admin_token(body.id.strip()), "token_type": "bearer", "expires_in": JWT_MINUTES * 60}

@api_router.post("/users/login")
async def user_login(body: UserLoginIn):
    worker_id = body.workerId.strip()

    user = await db.users.find_one({"workerId": worker_id})

    if not user or not user.get("passwordHash"):
        raise HTTPException(
            status_code=401,
            detail="Invalid Worker ID or password"
        )

    valid = bcrypt.checkpw(
        body.password.encode(),
        user["passwordHash"].encode()
    )

    if not valid:
        raise HTTPException(
            status_code=401,
            detail="Invalid Worker ID or password"
        )

    return {
        "access_token": issue_user_token(
            user["id"],
            user["workerId"]
        ),
        "token_type": "bearer",
        "expires_in": JWT_MINUTES * 60,
        "user": User(**clean(user)).dict(),
    }

@api_router.get("/admin/me")
async def admin_me(admin_id: str = Depends(require_admin)):
    return {"adminId": admin_id, "role": "admin"}


# ------------------------- Routes -------------------------
@api_router.get("/")
async def root():
    return {"message": "SURAKSHA AR API", "passThreshold": PASS_THRESHOLD, "org": ORG_NAME}


@api_router.get("/config")
async def config():
    return {"passThreshold": PASS_THRESHOLD, "org": ORG_NAME}


@api_router.post("/users", response_model=User)
async def create_user(payload: UserCreate):
    worker_id = payload.workerId.strip()

    existing = await db.users.find_one({"workerId": worker_id})
    if existing:
        return User(**clean(existing))

    password_hash = bcrypt.hashpw(
        payload.password.encode(),
        bcrypt.gensalt()
    ).decode()

    user = User(
        name=payload.name.strip(),
        workerId=worker_id,
        language=payload.language,
        ageGroup=payload.ageGroup,
        sector=payload.sector,
        organization=payload.organization,
    )

    record = user.dict()
    record["passwordHash"] = password_hash

    await db.users.insert_one(record)

    return user


@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    doc = await db.users.find_one({"id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**clean(doc))


@api_router.post("/attempts")
async def create_attempt(payload: AttemptCreate):
    prior = await db.attempts.find({"userId": payload.userId, "moduleId": payload.moduleId}).to_list(1000)
    attempts_count = len(prior) + 1
    record = payload.dict()
    record.update({
        "id": str(uuid.uuid4()),
        "attempts": attempts_count,
        "completedAt": now_iso(),
    })
    await db.attempts.insert_one(record)
    return clean(record)


@api_router.get("/attempts")
async def list_attempts(userId: str = Query(...)):
    docs = await db.attempts.find({"userId": userId}).to_list(1000)
    return [clean(d) for d in docs]


@api_router.post("/certificates")
async def create_certificate(payload: CertificateCreate):
    cert_id = await next_cert_id()
    record = payload.dict()
    record.update({
        "certificateId": cert_id,
        "issueDate": now_iso(),
        "verificationStatus": "VERIFIED",
        "org": ORG_NAME,
    })
    await db.certificates.insert_one(record)
    return clean(record)


@api_router.get("/certificates")
async def list_certificates(userId: str = Query(...)):
    docs = await db.certificates.find({"userId": userId}).sort("issueDate", -1).to_list(1000)
    return [clean(d) for d in docs]


@api_router.get("/certificates/verify/{cert_id}")
async def verify_certificate(cert_id: str):
    doc = await db.certificates.find_one({"certificateId": cert_id})
    if not doc:
        return {"found": False, "certificateId": cert_id}
    doc = clean(doc)
    doc["found"] = True
    return doc


# ------------------------- Admin -------------------------
@api_router.get("/admin/stats")
async def admin_stats(_: str = Depends(require_admin)):
    total_workers = await db.users.count_documents({})
    certs = await db.certificates.count_documents({})
    attempts = await db.attempts.find().to_list(10000)
    completed = len({a["userId"] for a in attempts if a.get("passed")})
    passed = len([a for a in attempts if a.get("passed")])
    total_att = len(attempts) if attempts else 1
    pass_rate = round(passed / total_att * 100)
    return {
        "totalWorkers": total_workers,
        "trainingCompleted": completed,
        "passRate": pass_rate,
        "certificatesIssued": certs,
    }


@api_router.get("/admin/workers")
async def admin_workers(_: str = Depends(require_admin)):
    users = await db.users.find().sort("createdAt", -1).to_list(2000)
    result = []
    for u in users:
        u = clean(u)
        atts = await db.attempts.find({"userId": u["id"]}).to_list(1000)
        certs = await db.certificates.count_documents({"userId": u["id"]})
        best = max([a["score"] for a in atts], default=0)
        result.append({
            **u,
            "modulesAttempted": len({a["moduleId"] for a in atts}),
            "totalAttempts": len(atts),
            "bestScore": best,
            "completed": any(a.get("passed") for a in atts),
            "certificates": certs,
        })
    return result


@api_router.get("/admin/certificates")
async def admin_certificates(query: str = Query(""), _: str = Depends(require_admin)):
    q = query.strip()
    filt = {}
    if q:
        filt = {"$or": [
            {"certificateId": {"$regex": q, "$options": "i"}},
            {"name": {"$regex": q, "$options": "i"}},
            {"workerId": {"$regex": q, "$options": "i"}},
        ]}
    docs = await db.certificates.find(filt).sort("issueDate", -1).to_list(2000)
    return [clean(d) for d in docs]


@api_router.get("/admin/analytics")
async def admin_analytics(_: str = Depends(require_admin)):
    attempts = await db.attempts.find().to_list(10000)
    by_module = {}
    for a in attempts:
        m = a.get("moduleTitle") or a.get("moduleId")
        d = by_module.setdefault(m, {"module": m, "attempts": 0, "passed": 0, "failed": 0, "scoreSum": 0})
        d["attempts"] += 1
        d["scoreSum"] += a.get("score", 0)
        if a.get("passed"):
            d["passed"] += 1
        else:
            d["failed"] += 1
    modules = []
    for d in by_module.values():
        d["avgScore"] = round(d["scoreSum"] / d["attempts"]) if d["attempts"] else 0
        modules.append(d)
    return {"modules": modules}


@api_router.post("/admin/seed")
async def admin_seed():
    if await db.users.count_documents({}) > 5:
        return {"seeded": False, "message": "already seeded"}
    names = ["Rahul Kumar", "Sita Devi", "Amit Soren", "Birsa Munda", "Rekha Kumari",
             "Vijay Mahato", "Suresh Oraon", "Anita Hansda", "Rakesh Singh", "Mangal Toppo",
             "Deepak Verma", "Lakshmi Mardi", "Naveen Gupta", "Pooja Kisku", "Ravi Prasad"]
    sectors = ["Mining", "Steel", "Mica", "Other"]
    langs = ["hi", "en", "sat"]
    modules = [("fire", "Fire & Explosion Response"), ("gas", "Gas Leak & Confined Space")]
    seeded_users = 0
    for i, nm in enumerate(names):
        u = User(name=nm, workerId=f"WK-2026-{i+1:03d}", language=random.choice(langs),
                 sector=random.choice(sectors), ageGroup=random.choice(["18-25", "26-35", "36-45", "46-55"]),
                 organization="Jharkhand Industrial Corp")
        await db.users.insert_one(u.dict())
        seeded_users += 1
        for mid, mtitle in modules:
            if random.random() < 0.75:
                score = random.choice([45, 55, 60, 71, 78, 85, 90, 95, 100])
                passed = score >= PASS_THRESHOLD
                rec = {"id": str(uuid.uuid4()), "userId": u.id, "workerName": nm,
                       "moduleId": mid, "moduleTitle": mtitle, "score": score,
                       "correct": round(score / 100 * 7), "total": 7, "passed": passed,
                       "attempts": 1, "durationSec": random.randint(60, 200),
                       "language": u.language, "completedAt": now_iso()}
                await db.attempts.insert_one(rec)
                if passed:
                    cid = await next_cert_id()
                    await db.certificates.insert_one({
                        "certificateId": cid, "userId": u.id, "name": nm, "workerId": u.workerId,
                        "moduleId": mid, "moduleTitle": mtitle, "score": score,
                        "issueDate": now_iso(), "verificationStatus": "VERIFIED", "org": ORG_NAME,
                        "language": u.language,
                    })
    return {"seeded": True, "users": seeded_users}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup():
    await seed_admin()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
