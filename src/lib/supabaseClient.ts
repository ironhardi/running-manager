"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "./types"; // falls du noch kein Types-File hast, kannst du diese Zeile entfernen

export const supabase = createClientComponentClient<Database>();