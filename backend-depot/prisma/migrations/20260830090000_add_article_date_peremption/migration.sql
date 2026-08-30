-- Add optional expiration timestamp to articles.
ALTER TABLE "Article" ADD COLUMN "datePeremption" TIMESTAMP(3);
