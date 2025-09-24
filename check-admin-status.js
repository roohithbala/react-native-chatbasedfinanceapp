const axios = require('axios');

// Test script to check user's admin status in groups
async function checkUserAdminStatus() {
  try {
    console.log('Checking user admin status in groups...');

    // First, get the user's groups
    const groupsResponse = await axios.get('http://10.40.155.172:3001/api/groups', {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE', // Replace with actual token
        'Content-Type': 'application/json'
      }
    });

    console.log('Groups response:', JSON.stringify(groupsResponse.data, null, 2));

    if (groupsResponse.data && groupsResponse.data.data && groupsResponse.data.data.groups) {
      const groups = groupsResponse.data.data.groups;

      for (const group of groups) {
        console.log(`\nGroup: ${group.name} (${group._id})`);
        console.log('Members:');

        if (group.members && Array.isArray(group.members)) {
          group.members.forEach(member => {
            console.log(`  - User ID: ${member.userId}, Role: ${member.role}, Active: ${member.isActive}`);
          });
        }

        console.log('Settings:', JSON.stringify(group.settings, null, 2));
      }
    } else {
      console.log('No groups found or unexpected response format');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

checkUserAdminStatus();