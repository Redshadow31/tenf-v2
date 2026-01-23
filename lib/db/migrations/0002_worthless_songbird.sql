ALTER TABLE "evaluations" ADD COLUMN "final_note" integer;--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "final_note_saved_at" timestamp;--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "final_note_saved_by" text;