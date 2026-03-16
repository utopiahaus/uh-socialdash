import { db } from "@/lib/db"
import { instagramProfiles } from "@/lib/db/schema"

async function main() {
  console.log("Seeding database...")

  // This is just for testing - in production, users will connect via OAuth
  console.log("Database seed complete")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
