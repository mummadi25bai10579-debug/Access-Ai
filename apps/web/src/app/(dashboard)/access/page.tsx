"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { DocumentDropzone } from "@/features/access/DocumentDropzone";
import { DocumentSelector } from "@/features/access/DocumentSelector";
import { GroundedQAView } from "@/features/access/GroundedQAView";
import { ContentTransformationTools } from "@/features/access/ContentTransformationTools";
import { ApiClient } from "@/lib/api/client";

export default function AccessPage() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = isSignedIn ? await getToken() : null;
      const docs = await ApiClient.listDocuments(token);
      if (Array.isArray(docs)) {
        setDocuments(docs);
        if (docs.length > 0) {
          setSelectedDoc(docs[0]);
        } else {
          setSelectedDoc(null);
        }
      }
    } catch {
      // Handled silently
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (isLoaded) {
      fetchDocuments();
    }
  }, [isLoaded, fetchDocuments]);

  const handleDocumentUploaded = (newDoc: any) => {
    const formatted = {
      ...newDoc,
      id: newDoc?.id || newDoc?.document_id || `doc-${Date.now()}`,
    };
    setDocuments((prev) => [formatted, ...prev.filter((d) => (d.id || d.document_id) !== formatted.id)]);
    setSelectedDoc(formatted);
  };

  return (
    <PullToRefresh onRefresh={fetchDocuments} className="space-y-8">
      <PageHeader
        title="AccessAI Assistant"
        description="Multimodal document understanding, optical character recognition (OCR), plain language simplification, and grounded question answering with page citations."
        badge={<Badge variant="primary">Shared Intelligence Layer</Badge>}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "AccessAI Assistant" },
        ]}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Document Upload & Context Selector */}
        <div className="lg:col-span-1 space-y-6">
          <DocumentDropzone onDocumentUploaded={handleDocumentUploaded} />

          <DocumentSelector
            documents={documents}
            selectedDocId={selectedDoc?.id}
            onSelectDoc={(doc) => setSelectedDoc(doc)}
          />
        </div>

        {/* Right Column: Grounded Q&A and Content Transformations */}
        <div className="lg:col-span-2 space-y-6">
          <GroundedQAView document={selectedDoc} />

          <ContentTransformationTools document={selectedDoc} />
        </div>
      </div>
    </PullToRefresh>
  );
}
