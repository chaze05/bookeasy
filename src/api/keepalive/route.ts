import { supabase } from "@/supabase/supabase";

export async function GET() {

    console.log(1);
    const { data,error } = await supabase 
        .from('keep_alive')
        .select('id')
        .limit(1)

    return Response.json({
        success: !error,
        data,
        error:error?.message,
        timeStamp:new Date().toISOString(),
    })
}