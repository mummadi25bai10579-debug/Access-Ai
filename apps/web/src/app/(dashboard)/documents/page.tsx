"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {
  FileText,
  Calendar,
  Eye,
  Trash2,
  FileSearch,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState } from "@/components/ui/EmptyState";
import { DocumentListSkeleton } from "@/components/ui/Skeleton";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { InfiniteScroll } from "@/components/ui/InfiniteScroll";
import { DocumentDropzone } from "@/features/access/DocumentDropzone";
import { DocumentViewerModal, ModalDocument } from "@/features/documents/DocumentViewerModal";
import { ApiClient } from "@/lib/api/client";
import { formatDate } from "@/lib/utils/format";

const PAGE_SIZE = 6;

export default function DocumentsPage() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeViewerDoc, setActiveViewerDoc] = useState<ModalDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const token = isSignedIn ? await getToken() : null;
      const docs = await ApiClient.listDocuments(token);
      if (Array.isArray(docs)) {
        setDocuments(docs);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (isLoaded) {
      fetchDocuments();
    }
  }, [isLoaded, fetchDocuments]);

  // Reset pagination when search query changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const token = isSignedIn ? await getToken() : null;
      await ApiClient.deleteDocument(id, token);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (activeViewerDoc?.id === id) {
        setActiveViewerDoc(null);
      }
    } catch (err: any) {
      alert(`Could not delete document: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      const token = isSignedIn ? await getToken() : null;
      await ApiClient.retryDocument(id, token);
      await fetchDocuments();
    } catch (err: any) {
      alert(`Retry failed: ${err.message}`);
    } finally {
      setRetryingId(null);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const name = (doc.filename || "").toLowerCase();
    const summary = (doc.extracted_text || doc.simplifiedSummary || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || summary.includes(query);
  });

  const displayedDocs = filteredDocs.slice(0, visibleCount);
  const hasMore = visibleCount < filteredDocs.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredDocs.length));
  };

  return (
    <PullToRefresh onRefresh={fetchDocuments} className="space-y-8">
      <PageHeader
        title="Document Studio & Repositories"
        description="Manage your ingested certificates, scholarship circulars, and academic marksheets. All files are indexed with dense embeddings for grounded semantic retrieval."
        badge={<Badge variant="primary">{documents.length} Files Stored</Badge>}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Document Studio" },
        ]}
      />

      {/* Top Upload Section */}
      <DocumentDropzone
        onDocumentUploaded={() => {
          fetchDocuments();
        }}
      />

      {/* Filter and Search */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <SearchInput
          value={searchQuery}
          onChangeValue={setSearchQuery}
          placeholder="Filter documents by filename or topic..."
          className="flex-1 max-w-md"
        />
        <div className="text-xs sm:text-sm text-muted">
          Showing {displayedDocs.length} of {filteredDocs.length} documents
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Document List */}
      {isLoading ? (
        <DocumentListSkeleton count={4} />
      ) : filteredDocs.length === 0 ? (
        <EmptyState
          title={searchQuery ? "No Matching Documents" : "No Documents Ingested Yet"}
          description={
            searchQuery
              ? "No stored documents matched your search filter."
              : "Upload a syllabus, certificate, or circular above to start using grounded AI question answering."
          }
          actionLabel={searchQuery ? "Clear Search" : undefined}
          onAction={searchQuery ? () => setSearchQuery("") : undefined}
        />
      ) : (
        <InfiniteScroll
          hasMore={hasMore}
          isLoading={false}
          onLoadMore={handleLoadMore}
          endMessage="All ingested documents loaded."
        >
          <div className="space-y-3.5">
            {displayedDocs.map((doc, idx) => {
              const pageCount = doc.page_count ?? doc.pageCount ?? 1;
              const uploadDate = formatDate(doc.created_at);
              const isFailed = (doc.status || "").toLowerCase() === "failed";

              return (
                <Card
                  key={doc.id || doc.document_id || `doc-${idx}`}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="p-3 rounded-xl bg-card border border-border text-primary shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-bold text-sm sm:text-base text-foreground truncate">
                          {doc.filename}
                        </h3>
                        <Badge
                          variant={isFailed ? "danger" : "success"}
                          className="text-xs"
                        >
                          {(doc.status || "COMPLETED").toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {pageCount} page(s)
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-muted leading-relaxed line-clamp-1">
                        {doc.extracted_text
                          ? doc.extracted_text.slice(0, 160)
                          : doc.simplifiedSummary || "Document ingested and indexed for semantic Q&A."}
                      </p>
                      <div className="text-xs text-muted flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Uploaded {uploadDate}</span>
                        {doc.fileSizeKb && (
                          <>
                            <span>·</span>
                            <span>{doc.fileSizeKb} KB</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                    {isFailed && (
                      <LoadingButton
                        variant="secondary"
                        size="sm"
                        isLoading={retryingId === doc.id}
                        loadingText="Retrying..."
                        leftIcon={<RotateCcw className="w-4 h-4" />}
                        onClick={() => handleRetry(doc.id)}
                      >
                        Retry
                      </LoadingButton>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Eye className="w-4 h-4" />}
                      onClick={() => setActiveViewerDoc(doc)}
                    >
                      Inspect
                    </Button>

                    <Link href="/access">
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<FileSearch className="w-4 h-4" />}
                      >
                        Ask Q&A
                      </Button>
                    </Link>

                    <LoadingButton
                      variant="ghost"
                      size="sm"
                      isLoading={deletingId === doc.id}
                      onClick={() => handleDelete(doc.id)}
                      aria-label={`Delete ${doc.filename}`}
                      className="text-muted hover:text-rose-400 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </LoadingButton>
                  </div>
                </Card>
              );
            })}
          </div>
        </InfiniteScroll>
      )}

      {/* Document Inspector Modal */}
      <DocumentViewerModal
        document={activeViewerDoc}
        onClose={() => setActiveViewerDoc(null)}
      />
    </PullToRefresh>
  );
}
