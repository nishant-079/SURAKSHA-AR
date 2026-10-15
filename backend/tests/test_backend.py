"""SURAKSHA AR backend API tests"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://ar-safety-train-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---- Health / config ----
class TestHealth:
    def test_root(self, api):
        r = api.get(f"{API}/")
        assert r.status_code == 200
        d = r.json()
        assert d.get("passThreshold") == 70
        assert "SURAKSHA" in d.get("org", "")

    def test_config(self, api):
        r = api.get(f"{API}/config")
        assert r.status_code == 200
        d = r.json()
        assert d["passThreshold"] == 70
        assert "org" in d


# ---- Users ----
class TestUsers:
    worker_id = f"TEST_WK_{int(time.time())}"
    user_id = None

    def test_create_user(self, api):
        payload = {"name": "TEST_Worker_A", "workerId": self.__class__.worker_id, "language": "en", "sector": "Mining"}
        r = api.post(f"{API}/users", json=payload)
        assert r.status_code == 200
        d = r.json()
        assert d["workerId"] == self.__class__.worker_id
        assert d["name"] == "TEST_Worker_A"
        assert "id" in d and d["id"]
        self.__class__.user_id = d["id"]

    def test_create_user_idempotent(self, api):
        payload = {"name": "TEST_Worker_A_v2", "workerId": self.__class__.worker_id, "language": "hi"}
        r = api.post(f"{API}/users", json=payload)
        assert r.status_code == 200
        d = r.json()
        # Should return existing user, not a new one
        assert d["id"] == self.__class__.user_id

    def test_get_user(self, api):
        r = api.get(f"{API}/users/{self.__class__.user_id}")
        assert r.status_code == 200
        assert r.json()["id"] == self.__class__.user_id

    def test_get_user_missing(self, api):
        r = api.get(f"{API}/users/does-not-exist-xyz")
        assert r.status_code == 404


# ---- Attempts ----
class TestAttempts:
    def test_create_attempt_and_list(self, api):
        # create a user for attempts
        wid = f"TEST_ATT_{int(time.time())}"
        u = api.post(f"{API}/users", json={"name": "TEST_Att", "workerId": wid}).json()
        uid = u["id"]

        p1 = {"userId": uid, "workerName": "TEST_Att", "moduleId": "fire",
              "moduleTitle": "Fire", "score": 60, "correct": 4, "total": 7, "passed": False}
        r1 = api.post(f"{API}/attempts", json=p1)
        assert r1.status_code == 200
        assert r1.json()["attempts"] == 1
        assert r1.json()["passed"] is False

        p2 = {**p1, "score": 90, "correct": 6, "passed": True}
        r2 = api.post(f"{API}/attempts", json=p2)
        assert r2.json()["attempts"] == 2

        rl = api.get(f"{API}/attempts", params={"userId": uid})
        assert rl.status_code == 200
        arr = rl.json()
        assert len(arr) == 2


# ---- Certificates ----
class TestCertificates:
    cert_id = None

    def test_create_and_verify_certificate(self, api):
        wid = f"TEST_CERT_{int(time.time())}"
        u = api.post(f"{API}/users", json={"name": "TEST_Cert", "workerId": wid}).json()
        r = api.post(f"{API}/certificates", json={
            "userId": u["id"], "name": "TEST_Cert", "workerId": wid,
            "moduleId": "fire", "moduleTitle": "Fire", "score": 88,
        })
        assert r.status_code == 200
        d = r.json()
        assert d["certificateId"].startswith("JH-SAFE-")
        assert d["verificationStatus"] == "VERIFIED"
        assert "_id" not in d
        self.__class__.cert_id = d["certificateId"]

    def test_verify_found(self, api):
        r = api.get(f"{API}/certificates/verify/{self.__class__.cert_id}")
        assert r.status_code == 200
        d = r.json()
        assert d["found"] is True
        assert d["certificateId"] == self.__class__.cert_id

    def test_verify_not_found(self, api):
        r = api.get(f"{API}/certificates/verify/JH-SAFE-9999-DOESNT")
        assert r.status_code == 200
        d = r.json()
        assert d["found"] is False


# ---- Admin ----
class TestAdmin:
    def test_stats(self, api):
        r = api.get(f"{API}/admin/stats")
        assert r.status_code == 200
        d = r.json()
        for k in ("totalWorkers", "trainingCompleted", "passRate", "certificatesIssued"):
            assert k in d
        assert d["totalWorkers"] >= 15  # seed created 15

    def test_workers(self, api):
        r = api.get(f"{API}/admin/workers")
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list) and len(arr) >= 15
        w = arr[0]
        for k in ("id", "name", "workerId", "modulesAttempted", "totalAttempts", "bestScore", "certificates"):
            assert k in w
        # No mongo _id leaking
        assert "_id" not in w

    def test_analytics(self, api):
        r = api.get(f"{API}/admin/analytics")
        assert r.status_code == 200
        d = r.json()
        assert "modules" in d
        assert isinstance(d["modules"], list)
        if d["modules"]:
            m = d["modules"][0]
            for k in ("module", "attempts", "passed", "failed", "avgScore"):
                assert k in m

    def test_certificates_search_empty(self, api):
        r = api.get(f"{API}/admin/certificates", params={"query": ""})
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_certificates_search_filter(self, api):
        r = api.get(f"{API}/admin/certificates", params={"query": "JH-SAFE"})
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list)
        for c in arr:
            assert "JH-SAFE" in c.get("certificateId", "")
