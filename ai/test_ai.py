"""
RoadIQ AI Service – ai/test_ai.py

Unit tests for the AI detection pipeline.

Run from the ai/ directory:
    python -m pytest test_ai.py -v

Or without pytest (stdlib only):
    python test_ai.py

Tests covered:
  1. Severity estimation math
  2. Mock detection returns a valid DetectionResult
  3. detect() in mock mode returns expected shape
  4. verify_repair() mock returns VerificationResult
  5. Missing / zero-byte image raises no crash (graceful fallback)
  6. CLASS_MAP contains all required damage types
  7. severity_to_score maps all labels to valid floats
"""

import sys
import os

# Make sure ai/ is on sys.path when running directly
sys.path.insert(0, os.path.dirname(__file__))

# Force mock mode for all tests so we never need a real model file
os.environ["AI_MOCK_MODE"] = "true"

import unittest


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_small_jpeg() -> bytes:
    """Return a tiny valid JPEG (1×1 red pixel) as bytes."""
    from PIL import Image
    import io
    img = Image.new("RGB", (4, 4), color=(255, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


# ---------------------------------------------------------------------------
# Test cases
# ---------------------------------------------------------------------------

class TestSeverityEstimation(unittest.TestCase):
    """severity.py – estimate_severity() correctness."""

    def setUp(self):
        from severity import estimate_severity
        self.estimate = estimate_severity

    def test_critical_high_confidence_large_bbox(self):
        # confidence=0.99, bbox_ratio=0.5 → score = 0.99*0.6 + min(0.5*5,1)*0.4 = 0.594+0.4 = 0.994 → CRITICAL
        result = self.estimate(0.99, 0.5)
        self.assertEqual(result, "CRITICAL")

    def test_high_medium_confidence(self):
        # confidence=0.80, bbox_ratio=0.05 → score = 0.48 + 0.1 = 0.58 → MEDIUM
        result = self.estimate(0.80, 0.05)
        self.assertIn(result, ("MEDIUM", "HIGH"))   # boundary area

    def test_low_low_confidence_tiny_bbox(self):
        # confidence=0.10, bbox_ratio=0.001 → score = 0.06 + 0.002 ≈ 0.062 → LOW
        result = self.estimate(0.10, 0.001)
        self.assertEqual(result, "LOW")

    def test_returns_valid_label(self):
        for conf in [0.0, 0.35, 0.6, 0.8, 1.0]:
            for ratio in [0.0, 0.05, 0.2, 0.5]:
                result = self.estimate(conf, ratio)
                self.assertIn(result, ("LOW", "MEDIUM", "HIGH", "CRITICAL"))


class TestSeverityToScore(unittest.TestCase):
    """severity.py – severity_to_score() mapping."""

    def setUp(self):
        from severity import severity_to_score
        self.score = severity_to_score

    def test_all_labels(self):
        self.assertEqual(self.score("CRITICAL"), 1.00)
        self.assertEqual(self.score("HIGH"),     0.75)
        self.assertEqual(self.score("MEDIUM"),   0.50)
        self.assertEqual(self.score("LOW"),      0.25)

    def test_unknown_label_returns_low(self):
        self.assertEqual(self.score("UNKNOWN"), 0.25)

    def test_case_insensitive(self):
        self.assertEqual(self.score("critical"), 1.00)
        self.assertEqual(self.score("High"),     0.75)


class TestClassMap(unittest.TestCase):
    """config.py – CLASS_MAP contains all required damage types."""

    def test_required_classes_present(self):
        from config import CLASS_MAP
        required = {
            "pothole", "longitudinal_crack", "transverse_crack",
            "alligator_crack", "damaged_road",
        }
        self.assertEqual(set(CLASS_MAP.values()), required)

    def test_keys_are_ints(self):
        from config import CLASS_MAP
        for k in CLASS_MAP:
            self.assertIsInstance(k, int)


class TestDetectorMockMode(unittest.TestCase):
    """detector.py – detect() in mock mode."""

    def setUp(self):
        from detector import detect, DetectionResult, Detection
        self.detect = detect
        self.DetectionResult = DetectionResult
        self.Detection = Detection

    def test_returns_detection_result_type(self):
        result = self.detect(b"fake-image-bytes")
        self.assertIsInstance(result, self.DetectionResult)

    def test_damage_detected_true(self):
        result = self.detect(b"fake-image-bytes")
        self.assertTrue(result.damage_detected)

    def test_detections_not_empty(self):
        result = self.detect(b"fake-image-bytes")
        self.assertGreater(len(result.detections), 0)

    def test_detection_fields_present(self):
        result = self.detect(b"fake-image-bytes")
        d = result.detections[0]
        self.assertIsInstance(d.damage_type, str)
        self.assertIsInstance(d.confidence, float)
        self.assertIn(d.severity, ("LOW", "MEDIUM", "HIGH", "CRITICAL"))
        self.assertEqual(len(d.bbox), 4)
        self.assertIn(d.damage_type, {
            "pothole", "longitudinal_crack", "transverse_crack",
            "alligator_crack", "damaged_road",
        })

    def test_source_is_mock(self):
        result = self.detect(b"fake-image-bytes")
        self.assertEqual(result.source, "mock")

    def test_empty_bytes_does_not_crash(self):
        """Empty image bytes should not raise an exception in mock mode."""
        result = self.detect(b"")
        self.assertIsInstance(result, self.DetectionResult)

    def test_confidence_in_range(self):
        result = self.detect(b"fake-image-bytes")
        for d in result.detections:
            self.assertGreaterEqual(d.confidence, 0.0)
            self.assertLessEqual(d.confidence, 1.0)


class TestDetectorWithRealImage(unittest.TestCase):
    """detector.py – detect() with a real (tiny) JPEG in mock mode."""

    def test_real_jpeg_mock_mode(self):
        """Passing a real JPEG should still return a mock DetectionResult."""
        from detector import detect, DetectionResult
        jpeg_bytes = _make_small_jpeg()
        result = detect(jpeg_bytes)
        self.assertIsInstance(result, DetectionResult)
        self.assertEqual(result.source, "mock")


class TestVerificationMockMode(unittest.TestCase):
    """verification.py – compare_before_after() in mock mode."""

    def setUp(self):
        from verification import compare_before_after, VerificationResult
        self.compare = compare_before_after
        self.VerificationResult = VerificationResult

    def test_returns_verification_result(self):
        result = self.compare("http://example.com/before.jpg", "http://example.com/after.jpg")
        self.assertIsInstance(result, self.VerificationResult)

    def test_verified_true_in_mock(self):
        result = self.compare("http://a.com/b.jpg", "http://a.com/a.jpg")
        self.assertTrue(result.verified)

    def test_damage_detected_false_in_mock(self):
        result = self.compare("http://a.com/b.jpg", "http://a.com/a.jpg")
        self.assertFalse(result.damage_detected)

    def test_source_is_mock(self):
        result = self.compare("http://a.com/b.jpg", "http://a.com/a.jpg")
        self.assertEqual(result.source, "mock")

    def test_notes_not_empty(self):
        result = self.compare("http://a.com/b.jpg", "http://a.com/a.jpg")
        self.assertTrue(len(result.notes) > 0)

    def test_confidence_in_range(self):
        result = self.compare("http://a.com/b.jpg", "http://a.com/a.jpg")
        self.assertGreaterEqual(result.confidence, 0.0)
        self.assertLessEqual(result.confidence, 1.0)


# ---------------------------------------------------------------------------
# Entry point (works without pytest)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    loader = unittest.TestLoader()
    suite  = unittest.TestSuite()
    for cls in [
        TestSeverityEstimation,
        TestSeverityToScore,
        TestClassMap,
        TestDetectorMockMode,
        TestDetectorWithRealImage,
        TestVerificationMockMode,
    ]:
        suite.addTests(loader.loadTestsFromTestCase(cls))

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
