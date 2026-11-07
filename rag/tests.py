import os
from unittest.mock import Mock, patch

from django.test import SimpleTestCase

from rag.groq_client import chat


class GroqClientTests(SimpleTestCase):
    @patch.dict(os.environ, {"GROQ_API_KEY": "unit-test-key"})
    @patch("rag.groq_client.httpx.post")
    def test_explicit_completion_budget_is_sent_to_provider(self, mock_post):
        response = Mock(status_code=200, headers={})
        response.json.return_value = {"choices": [{"message": {"content": "{}"}}]}
        mock_post.return_value = response

        result = chat("Return JSON.", json_mode=True, max_tokens=380)

        self.assertEqual(result, "{}")
        self.assertEqual(mock_post.call_args.kwargs["json"]["max_tokens"], 380)

    @patch.dict(os.environ, {"GROQ_API_KEY": "unit-test-key"})
    @patch("rag.groq_client.time.sleep")
    @patch("rag.groq_client.httpx.post")
    def test_rate_limit_retry_respects_retry_after_header(self, mock_post, mock_sleep):
        limited = Mock(status_code=429, headers={"retry-after": "31.68"})
        success = Mock(status_code=200, headers={})
        success.json.return_value = {"choices": [{"message": {"content": "{}"}}]}
        mock_post.side_effect = [limited, success]

        self.assertEqual(chat("Return JSON.", max_tokens=380), "{}")

        mock_sleep.assert_called_once_with(31.68)
        self.assertEqual(mock_post.call_count, 2)
