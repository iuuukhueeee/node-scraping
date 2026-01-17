-- CreateTable
CREATE TABLE "Media" (
    "id" SERIAL NOT NULL,
    "source_url" TEXT NOT NULL,
    "media_url" TEXT NOT NULL,
    "media_type" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "alt_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "errors" TEXT,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);
