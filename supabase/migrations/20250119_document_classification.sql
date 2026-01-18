-- Add AI classification data to documents table
-- This stores the AI-generated classification results

ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS classification_data JSONB;

-- Add an index for querying by classification
CREATE INDEX IF NOT EXISTS idx_documents_classification
ON public.documents USING GIN (classification_data);

-- Add a column to track if classification has been reviewed/confirmed
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS classification_confirmed BOOLEAN DEFAULT FALSE;

-- Comment explaining the classification_data structure
COMMENT ON COLUMN public.documents.classification_data IS 'AI classification result containing: category, documentType, confidence, suggestedChecklistItem, extractedInfo, quality assessment, and summary';
