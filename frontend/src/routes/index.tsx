import { createFileRoute } from "@tanstack/react-router";

import { useState } from "react";
import axios from "axios";
import { Upload, AlertCircle, CheckCircle, Loader } from "lucide-react";
import "../App.css";

const API = "http://localhost:3001/api";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [urls, setUrls] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const lineCount = urls.split("\n").filter((line) => line.trim()).length;
  const maxLines = 5000;
  const isOverLimit = lineCount > maxLines;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (lineCount === 0) {
      setStatus("error");
      setMessage("Please enter at least one URL");
      return;
    }

    if (isOverLimit) {
      setStatus("error");
      setMessage(`Maximum ${maxLines} URLs allowed. You have ${lineCount}`);
      return;
    }

    setLoading(true);
    setStatus("idle");

    try {
      const urlList = urls
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      // Replace with your actual API endpoint
      await axios.post(`${API}/scrape`, {
        urls: urlList,
      });

      setStatus("success");
      setMessage(`Successfully submitted ${urlList.length} URLs`);
      setUrls("");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Failed to submit URLs",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Upload className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">URL Scraper</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="urls"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Enter URLs (one per line, max {maxLines} URLs)
              </label>
              <textarea
                id="urls"
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder="https://example.com&#10;https://example.com/page&#10;..."
                className={`w-full h-64 p-4 border-2 rounded-lg font-mono text-sm resize-none focus:outline-none transition-colors ${
                  isOverLimit
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300 focus:border-indigo-500"
                }`}
                disabled={loading}
              />
              <div
                className={`mt-2 text-sm ${isOverLimit ? "text-red-600" : "text-gray-600"}`}
              >
                {lineCount} / {maxLines} URLs
              </div>
            </div>

            {status === "success" && (
              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">{message}</span>
              </div>
            )}

            {status === "error" && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || isOverLimit || lineCount === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Submit URLs
                </>
              )}
            </button>
          </form>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> You can paste multiple URLs separated by
              newlines. The form will validate and send them to the server for
              processing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
