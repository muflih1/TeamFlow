ALTER TABLE "conversations" DROP CONSTRAINT "conversations_member_one_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_member_two_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_member_one_id_workspace_memberships_id_fk" FOREIGN KEY ("member_one_id") REFERENCES "public"."workspace_memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_member_two_id_workspace_memberships_id_fk" FOREIGN KEY ("member_two_id") REFERENCES "public"."workspace_memberships"("id") ON DELETE cascade ON UPDATE no action;