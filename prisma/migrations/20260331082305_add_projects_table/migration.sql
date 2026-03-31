-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "site" "Site" NOT NULL DEFAULT 'WEBBRIKS',
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "impactAreas" TEXT[],
    "startDate" TIMESTAMP(3) NOT NULL,
    "clientLocation" TEXT NOT NULL,
    "image" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'published',
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "keywords" TEXT[],
    "description" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_site_key" ON "Project"("slug", "site");
