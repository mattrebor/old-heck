import { useState } from "react";

const LINK_COPIED_TIMEOUT_MS = 2000;

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  accessType: "owner" | "shared";
  onGenerateEditLink: () => Promise<void>;
  shareLink: string | null;
  generatingLink: boolean;
  shareLinkCopied: boolean;
  setShareLinkCopied: (value: boolean) => void;
}

export default function ShareModal({
  isOpen,
  onClose,
  gameId,
  accessType,
  onGenerateEditLink,
  shareLink,
  generatingLink,
  shareLinkCopied,
  setShareLinkCopied,
}: ShareModalProps) {
  const [viewLinkCopied, setViewLinkCopied] = useState(false);

  if (!isOpen) return null;

  const viewOnlyLink = `${window.location.origin}/game/${gameId}/view`;

  async function handleCopyViewLink() {
    await navigator.clipboard.writeText(viewOnlyLink);
    setViewLinkCopied(true);
    setTimeout(() => setViewLinkCopied(false), LINK_COPIED_TIMEOUT_MS);
  }

  async function handleCopyEditLink() {
    if (shareLink) {
      await navigator.clipboard.writeText(shareLink);
      setShareLinkCopied(true);
      setTimeout(() => setShareLinkCopied(false), LINK_COPIED_TIMEOUT_MS);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b-2 border-gray-200 p-4 sm:p-6 flex justify-between items-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              🔗 Share Game
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-6">
            {/* View-Only Link Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👁️</span>
                <h3 className="text-lg font-bold text-purple-800">
                  View-Only Link
                </h3>
              </div>
              <p className="text-sm text-gray-700">
                Share this link to let others watch the game in real-time (no editing).
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={viewOnlyLink}
                  readOnly
                  className="flex-1 p-3 border-2 border-purple-300 rounded-lg font-mono text-sm bg-purple-50"
                />
                <button
                  onClick={handleCopyViewLink}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                    viewLinkCopied
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "bg-purple-600 hover:bg-purple-700 text-white"
                  }`}
                >
                  {viewLinkCopied ? "✓ Copied!" : "📋 Copy"}
                </button>
              </div>
            </div>

            {/* Edit Link Section (Owner only) */}
            {accessType === "owner" && (
              <>
                <div className="border-t-2 border-gray-200 pt-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">✏️</span>
                    <h3 className="text-lg font-bold text-blue-800">
                      Edit Access Link
                    </h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    Generate a one-time link to let someone else edit this game with you.
                  </p>

                  {!shareLink ? (
                    <button
                      onClick={onGenerateEditLink}
                      disabled={generatingLink}
                      className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-all"
                    >
                      {generatingLink ? "Generating..." : "🔗 Generate Link"}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={shareLink}
                          readOnly
                          className="flex-1 p-3 border-2 border-blue-300 rounded-lg font-mono text-sm bg-blue-50 break-all"
                        />
                        <button
                          onClick={handleCopyEditLink}
                          className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                            shareLinkCopied
                              ? "bg-green-500 hover:bg-green-600 text-white"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        >
                          {shareLinkCopied ? "✓ Copied!" : "📋 Copy"}
                        </button>
                      </div>
                      <p className="text-xs text-gray-600">
                        ⚠️ This link can only be used once. Share it carefully!
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Shared Access Indicator */}
            {accessType === "shared" && (
              <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
                <p className="text-sm text-purple-800 font-semibold">
                  👥 You're editing via shared access. Only the game owner can generate new share links.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
