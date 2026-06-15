import fetch from 'node-fetch';

async function test() {
  const res = await fetch('http://localhost:5050/api/payroll/employees/DEMO001', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: "Admin User",
      department: "IT",
      baseSalary: 6000,
      fixedAllowance: 1200,
      paymentMethod: "Bank Transfer",
      bankName: "Test Bank",
      accountNo: "123456789"
    })
  });
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Data:', data);
}

test();
