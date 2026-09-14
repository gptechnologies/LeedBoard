# Conversation messaging

Homeowners and cleaners use the same bid-linked message history. The original bid note is displayed as the first cleaner message. Later app messages and inbound texts are stored in `ConversationMessage`. The homeowner's chosen confirmation is shown in its chronological position. App messages are available before SMS is enabled.

For an SMS-only cleaner (a bid with a cleaner lead and no linked app user), the homeowner composer sends a text through the Well Kept number. The text contains a conversation ID, such as `WK-615689-ABCDEFGH`. A reply to that number appears as a cleaner message in the homeowner thread. A homeowner who texts the Well Kept number from the phone on their account can also reply; that message enters the same thread and is relayed to an SMS-only cleaner. The conversation ID is displayed by the homeowner composer for this case. App cleaners can reply in their app thread. The inboxes poll for new messages while open.

## Phone provider setup

1. Apply the additive Prisma schema change (`npm run db:push`) to the deployment database before deploying this code.
2. Configure `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and a dedicated, SMS-capable `TWILIO_FROM_PHONE_NUMBER` in E.164 format. Set `ENABLE_SMS_OUTREACH=true`. A Messaging Service by itself is insufficient for conversation routing because inbound replies must target the same fixed number.
3. Set the number's incoming message webhook to `https://<app-domain>/api/webhooks/twilio/messaging` using HTTP POST. Set `TWILIO_MESSAGING_WEBHOOK_URL` to that exact public URL for signature validation. Configure `APP_BASE_URL` (or `NEXT_PUBLIC_APP_URL`) to the same app origin so outgoing status callbacks reach this endpoint.
4. Verify a full exchange using a real SMS-only cleaner number: homeowner app message → cleaner text → homeowner app thread, then homeowner text → cleaner text. Confirm outbound status and failure display. Twilio account/number provisioning and carrier approval are external setup steps.

The configured database was synchronized with this schema during implementation. Step 1 is needed for any additional database environment before that environment runs the new code.

Incoming webhooks are signature-checked and deduplicated by provider message ID. A reply from a phone with exactly one active bid routes to that bid; a phone with multiple active bids must include its conversation ID. Ambiguous replies receive an SMS asking for the ID and are never attached to an arbitrary job. Opt-out keywords continue to use the existing outreach handling.
