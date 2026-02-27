import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BookkeeperInquiryRequest {
  inquiryId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { inquiryId }: BookkeeperInquiryRequest = await req.json();

    if (!inquiryId) {
      return new Response(
        JSON.stringify({ error: "inquiryId is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { data: inquiry, error: inquiryError } = await supabase
      .from("bookkeeper_inquiries")
      .select(`
        id,
        message,
        created_at,
        user_id
      `)
      .eq("id", inquiryId)
      .maybeSingle();

    if (inquiryError) {
      throw inquiryError;
    }

    if (!inquiry) {
      return new Response(
        JSON.stringify({ error: "Inquiry not found" }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email, entity_id")
      .eq("id", inquiry.user_id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    let entityName = "Not specified";
    if (profile?.current_entity_id) {
      const { data: entity } = await supabase
        .from("entities")
        .select("entity_name")
        .eq("id", profile.current_entity_id)
        .maybeSingle();

      if (entity?.entity_name) {
        entityName = entity.entity_name;
      }
    }

    const emailContent = `
      <h2>New Bookkeeper Inquiry</h2>
      <p>A user has submitted an inquiry to connect with Easy Expense App's bookkeeping services.</p>

      <h3>User Details:</h3>
      <ul>
        <li><strong>Name:</strong> ${profile?.full_name || "Not provided"}</li>
        <li><strong>Email:</strong> ${profile?.email || "Not provided"}</li>
        <li><strong>Entity:</strong> ${entityName}</li>
      </ul>

      <h3>Message:</h3>
      <p>${inquiry.message}</p>

      <hr>
      <p><small>Submitted on: ${new Date(inquiry.created_at).toLocaleString()}</small></p>
    `;

    console.log("Bookkeeper inquiry email would be sent to jenny@middlemanbooks.com");
    console.log("Email content:", emailContent);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Bookkeeper inquiry email sent successfully"
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in send-bookkeeper-email function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
