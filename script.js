const $ = s => document.querySelector(s);
const { createClient } = supabase;
const db = createClient("https://jgpkjkwhfexkjvyzpqar.supabase.co", "sb_publishable_q6z3S8fROzE3nlyFIeUH4A_Dtg6xkCd");

$('#loginBtn').onclick = () => {
  alert("Bhai, button toh chal raha hai!");
};
