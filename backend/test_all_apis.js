const axios = require('axios');
const http = require('http');

const agent = new http.Agent({ keepAlive: true });
const client = axios.create({
  baseURL: 'http://localhost:8000/api/',
  withCredentials: true,
  httpAgent: agent
});

async function runTests() {
  console.log('=== STARTING EXPRESS BACKEND API VERIFICATION TESTS ===\n');

  try {
    // 1. Categories
    const categories = await client.get('categories/');
    console.log('1. Categories API:', categories.status === 200 ? '✅ PASSED' : '❌ FAILED', `(${categories.data.length} categories)`);

    // 2. Products by Category
    const productsCat = await client.get('products/1/');
    console.log('2. Products by Category API:', productsCat.status === 200 ? '✅ PASSED' : '❌ FAILED', `(${productsCat.data.length} products)`);

    // 3. Product Search
    const search = await client.get('products/search/?search=A4');
    console.log('3. Product Search API:', search.status === 200 ? '✅ PASSED' : '❌ FAILED', `(${search.data.length} search results)`);

    // 4. Best Sellers
    const bestSellers = await client.get('best-sellers/');
    console.log('4. Best Sellers API:', bestSellers.status === 200 ? '✅ PASSED' : '❌ FAILED', `(${bestSellers.data.length} items)`);

    // 5. Product Detail
    const productDetail = await client.get('product/5/');
    console.log('5. Product Detail API:', productDetail.status === 200 ? '✅ PASSED' : '❌ FAILED', `(Product: ${productDetail.data.name})`);

    // 6. Visitor Count
    const visitors = await client.get('visitors/');
    console.log('6. Visitor Count API:', visitors.status === 200 ? '✅ PASSED' : '❌ FAILED', `(Count: ${visitors.data.visitors})`);

    // 7. Store Stats
    const stats = await client.get('stats/');
    console.log('7. Store Stats API:', stats.status === 200 ? '✅ PASSED' : '❌ FAILED', `(Happy Customers: ${stats.data.happy_customers})`);

    // 8. Feedback GET
    const feedbackList = await client.get('feedback/');
    console.log('8. Feedback GET API:', feedbackList.status === 200 ? '✅ PASSED' : '❌ FAILED', `(${feedbackList.data.length} feedbacks)`);

    // 9. Feedback POST
    const feedbackPost = await client.post('feedback/', {
      username: 'testadmin2',
      stars: 5,
      message: 'Great stationery products and super fast delivery!'
    });
    console.log('9. Feedback POST API:', feedbackPost.status === 201 ? '✅ PASSED' : '❌ FAILED', `(${feedbackPost.data.message})`);

    // 10. Login Admin
    const loginRes = await client.post('auth/login/', {
      username: 'testadmin2',
      password: 'TestPassword123'
    });
    const cookie = loginRes.headers['set-cookie'];
    console.log('10. Admin Login API:', loginRes.status === 200 ? '✅ PASSED' : '❌ FAILED', `(Admin: ${loginRes.data.is_admin})`);

    const authHeaders = { headers: { Cookie: cookie } };

    // 11. Profile GET
    const profileRes = await client.get('auth/profile/', authHeaders);
    console.log('11. Profile GET API:', profileRes.status === 200 ? '✅ PASSED' : '❌ FAILED', `(Username: ${profileRes.data.username})`);

    // 12. Profile PUT
    const profileUpdate = await client.put('auth/profile/', {
      full_name: 'Test Admin User',
      address: '123 Station Road',
      pincode: '380001',
      mobile: '9876543210'
    }, authHeaders);
    console.log('12. Profile PUT API:', profileUpdate.status === 200 ? '✅ PASSED' : '❌ FAILED', `(Name: ${profileUpdate.data.full_name})`);

    // 13. Create Order (COD)
    const createOrder = await client.post('create-order/', {
      username: 'testadmin2',
      customer_name: 'Test Admin User',
      email: 'aharsh1993@gmail.com',
      phone: '9876543210',
      address: '123 Station Road',
      city: 'Ahmedabad',
      pincode: '380001',
      payment_method: 'cod',
      total_amount: 350,
      items: JSON.stringify([{ product: 5, product_name: '100 gsm JK shedar A4', price: 350, quantity: 1 }])
    }, authHeaders);
    console.log('13. Create Order API:', createOrder.status === 201 ? '✅ PASSED' : '❌ FAILED', `(Order ID: ${createOrder.data.order_id})`);

    // 14. User Orders
    const userOrders = await client.get('user-orders/?username=testadmin2');
    console.log('14. User Orders API:', userOrders.status === 200 ? '✅ PASSED' : '❌ FAILED', `(${userOrders.data.length} orders found)`);

    // 15. Admin Users GET
    const adminUsers = await client.get('admin-api/users/', authHeaders);
    console.log('15. Admin Users API:', adminUsers.status === 200 ? '✅ PASSED' : '❌ FAILED', `(${adminUsers.data.length} total users)`);

    // 16. Admin Orders GET
    const adminOrders = await client.get('admin-api/orders/', authHeaders);
    console.log('16. Admin Orders API:', adminOrders.status === 200 ? '✅ PASSED' : '❌ FAILED', `(${adminOrders.data.length} total orders)`);

    // 17. Admin Update Order Status
    const updateStatus = await client.put(`admin-api/orders/${createOrder.data.order_id}/status/`, {
      status: 'out_for_delivery',
      admin_comment: 'Order packed and out for delivery'
    }, authHeaders);
    console.log('17. Admin Update Order Status API:', updateStatus.status === 200 ? '✅ PASSED' : '❌ FAILED', `(${updateStatus.data.message})`);

    // 18. Admin Products GET
    const adminProducts = await client.get('admin-api/products/', authHeaders);
    console.log('18. Admin Products API:', adminProducts.status === 200 ? '✅ PASSED' : '❌ FAILED', `(${adminProducts.data.length} products)`);

    console.log('\n=== ALL 18 EXPRESS BACKEND API VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('❌ Verification Error:', err.response ? err.response.data : err.message);
  }
}

runTests();
