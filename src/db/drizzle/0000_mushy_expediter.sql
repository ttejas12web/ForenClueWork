CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"forenclue_id" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(50) DEFAULT 'EMPLOYEE' NOT NULL,
	"joining_date" timestamp DEFAULT now(),
	"temp_password_changed" boolean DEFAULT false,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_forenclue_id_unique" UNIQUE("forenclue_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
