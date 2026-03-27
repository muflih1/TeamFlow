CREATE TABLE "reactions" (
	"id" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"member_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"message_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_member_id_workspace_memberships_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."workspace_memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reactions_workspace_id_index" ON "reactions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "reactions_message_id_index" ON "reactions" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "reactions_member_id_index" ON "reactions" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "conversations_workspace_id_index" ON "conversations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "messages_workspace_id_index" ON "messages" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "messages_member_id_index" ON "messages" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "messages_channel_id_index" ON "messages" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "messages_conversation_id_index" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "messages_channel_id_parent_message_id_index" ON "messages" USING btree ("channel_id","parent_message_id");