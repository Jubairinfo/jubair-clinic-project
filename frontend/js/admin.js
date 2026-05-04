import { supabase } from './supabase.js';

async function loadData() {
  const { data } = await supabase
    .from('appointments')
    .select('*')
    .order('id', { ascending: false });

  const table = document.getElementById("data");
  table.innerHTML = "";

  data.forEach(item => {
    table.innerHTML += `
      <tr>
        <td>${item.name}</td>
        <td>${item.phone}</td>
        <td>${item.service}</td>
        <td>${item.date}</td>
        <td>${item.time}</td>
        <td>${item.status}</td>
      </tr>
    `;
  });
}

loadData();