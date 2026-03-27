CREATE TABLE "sessions" (
	"id" integer NOT NULL,
	"user_id" text NOT NULL,
	"secret_hash" "bytea" NOT NULL,
	"user_agent" text,
	"ip_address" "inet",
	"revoked_at" timestamp with time zone,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_rotated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"email" varchar(254) NOT NULL,
	"email_verification_at" timestamp with time zone,
	"password_digest" varchar(255),
	"image_object_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;