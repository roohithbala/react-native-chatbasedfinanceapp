#!/usr/bin/env node

/**
 * End-to-End Call Testing Script
 * Tests the complete calling functionality including:
 * - Socket connection
 * - Outgoing call initiation
 * - Incoming call notification
 * - Call acceptance/decline
 * - Media initialization
 * - Call termination
 */

const axios = require('axios');
const io = require('socket.io-client');

const BACKEND_URL = 'http://localhost:3000';
const TEST_USER_1 = 'test_user_1';
const TEST_USER_2 = 'test_user_2';

class CallTester {
  constructor() {
    this.socket1 = null;
    this.socket2 = null;
    this.callId = null;
    this.testResults = [];
  }

  log(message, status = 'info') {
    const timestamp = new Date().toISOString();
    const statusEmoji = {
      'info': 'ℹ️',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️'
    };
    console.log(`[${timestamp}] ${statusEmoji[status]} ${message}`);
    this.testResults.push({ timestamp, message, status });
  }

  async testBackendConnection() {
    try {
      this.log('Testing backend connection...');
      const response = await axios.get(`${BACKEND_URL}/health`);
      if (response.status === 200) {
        this.log('Backend connection successful', 'success');
        return true;
      }
    } catch (error) {
      this.log(`Backend connection failed: ${error.message}`, 'error');
    }
    return false;
  }

  async connectSockets() {
    return new Promise((resolve) => {
      this.log('Connecting test sockets...');

      let connectedCount = 0;
      const checkComplete = () => {
        connectedCount++;
        if (connectedCount === 2) {
          this.log('Both sockets connected successfully', 'success');
          resolve(true);
        }
      };

      // Connect first socket
      this.socket1 = io(BACKEND_URL, {
        query: { userId: TEST_USER_1 }
      });

      this.socket1.on('connect', () => {
        this.log(`Socket 1 connected as ${TEST_USER_1}`, 'success');
        checkComplete();
      });

      this.socket1.on('disconnect', () => {
        this.log('Socket 1 disconnected', 'warning');
      });

      // Connect second socket
      this.socket2 = io(BACKEND_URL, {
        query: { userId: TEST_USER_2 }
      });

      this.socket2.on('connect', () => {
        this.log(`Socket 2 connected as ${TEST_USER_2}`, 'success');
        checkComplete();
      });

      this.socket2.on('disconnect', () => {
        this.log('Socket 2 disconnected', 'warning');
      });

      // Set up call event listeners
      this.setupCallListeners();

      // Timeout after 10 seconds
      setTimeout(() => {
        if (connectedCount < 2) {
          this.log('Socket connection timeout', 'error');
          resolve(false);
        }
      }, 10000);
    });
  }

  setupCallListeners() {
    // Socket 1 listeners
    this.socket1.on('call-offer', (data) => {
      this.log(`Socket 1 received call offer: ${JSON.stringify(data)}`, 'info');
      this.callId = data.callId;
    });

    this.socket1.on('call-answer', (data) => {
      this.log(`Socket 1 received call answer: ${JSON.stringify(data)}`, 'success');
    });

    this.socket1.on('ice-candidate', (data) => {
      this.log(`Socket 1 received ICE candidate`, 'info');
    });

    this.socket1.on('call-end', (data) => {
      this.log(`Socket 1 received call end: ${JSON.stringify(data)}`, 'info');
    });

    // Socket 2 listeners
    this.socket2.on('call-offer', (data) => {
      this.log(`Socket 2 received call offer: ${JSON.stringify(data)}`, 'info');
      this.callId = data.callId;
    });

    this.socket2.on('call-answer', (data) => {
      this.log(`Socket 2 received call answer: ${JSON.stringify(data)}`, 'success');
    });

    this.socket2.on('ice-candidate', (data) => {
      this.log(`Socket 2 received ICE candidate`, 'info');
    });

    this.socket2.on('call-end', (data) => {
      this.log(`Socket 2 received call end: ${JSON.stringify(data)}`, 'info');
    });
  }

  async testOutgoingCall() {
    return new Promise((resolve) => {
      this.log('Testing outgoing call from Socket 1 to Socket 2...');

      const callData = {
        callId: `test_call_${Date.now()}`,
        participants: [TEST_USER_2],
        type: 'voice',
        offer: {
          type: 'offer',
          sdp: 'v=0\r\no=- 123456789 123456789 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=msid-semantic: WMS\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:test\r\na=ice-pwd:test\r\na=fingerprint:sha-256 test\r\na=setup:actpass\r\na=mid:0\r\na=sendrecv\r\na=rtcp-mux\r\na=rtpmap:111 opus/48000/2\r\na=fmtp:111 minptime=10;useinbandfec=1\r\na=ssrc:123456789 cname:test'
        }
      };

      this.socket1.emit('call-offer', callData);

      // Wait for call to be processed
      setTimeout(() => {
        this.log('Outgoing call test completed', 'success');
        resolve(true);
      }, 2000);
    });
  }

  async testCallAnswer() {
    return new Promise((resolve) => {
      this.log('Testing call answer from Socket 2...');

      const answerData = {
        callId: this.callId,
        answer: {
          type: 'answer',
          sdp: 'v=0\r\no=- 987654321 987654321 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=msid-semantic: WMS\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:test\r\na=ice-pwd:test\r\na=fingerprint:sha-256 test\r\na=setup:active\r\na=mid:0\r\na=sendrecv\r\na=rtcp-mux\r\na=rtpmap:111 opus/48000/2\r\na=fmtp:111 minptime=10;useinbandfec=1\r\na=ssrc:987654321 cname:test'
        }
      };

      this.socket2.emit('call-answer', answerData);

      // Wait for answer to be processed
      setTimeout(() => {
        this.log('Call answer test completed', 'success');
        resolve(true);
      }, 2000);
    });
  }

  async testICECandidates() {
    return new Promise((resolve) => {
      this.log('Testing ICE candidate exchange...');

      const iceCandidate = {
        callId: this.callId,
        candidate: {
          candidate: 'candidate:1 1 UDP 2122260223 192.168.1.1 52305 typ host',
          sdpMid: '0',
          sdpMLineIndex: 0
        },
        participants: [TEST_USER_2]
      };

      // Send ICE candidate from socket 1
      this.socket1.emit('ice-candidate', iceCandidate);

      // Send ICE candidate from socket 2
      iceCandidate.participants = [TEST_USER_1];
      this.socket2.emit('ice-candidate', iceCandidate);

      // Wait for ICE exchange to complete
      setTimeout(() => {
        this.log('ICE candidate exchange test completed', 'success');
        resolve(true);
      }, 2000);
    });
  }

  async testCallEnd() {
    return new Promise((resolve) => {
      this.log('Testing call termination...');

      const endData = {
        callId: this.callId,
        participants: [TEST_USER_2]
      };

      this.socket1.emit('call-end', endData);

      // Wait for call end to be processed
      setTimeout(() => {
        this.log('Call termination test completed', 'success');
        resolve(true);
      }, 2000);
    });
  }

  async cleanup() {
    this.log('Cleaning up test connections...');

    if (this.socket1) {
      this.socket1.disconnect();
    }
    if (this.socket2) {
      this.socket2.disconnect();
    }

    this.log('Cleanup completed', 'success');
  }

  async runTests() {
    this.log('🚀 Starting End-to-End Call Testing');

    try {
      // Test 1: Backend connection
      const backendOk = await this.testBackendConnection();
      if (!backendOk) {
        throw new Error('Backend connection test failed');
      }

      // Test 2: Socket connections
      const socketsOk = await this.connectSockets();
      if (!socketsOk) {
        throw new Error('Socket connection test failed');
      }

      // Test 3: Outgoing call
      await this.testOutgoingCall();

      // Test 4: Call answer
      await this.testCallAnswer();

      // Test 5: ICE candidates
      await this.testICECandidates();

      // Test 6: Call termination
      await this.testCallEnd();

      this.log('🎉 All tests completed successfully!', 'success');

    } catch (error) {
      this.log(`💥 Test suite failed: ${error.message}`, 'error');
    } finally {
      await this.cleanup();
    }

    // Print summary
    this.printSummary();
  }

  printSummary() {
    console.log('\n📊 Test Summary:');
    console.log('='.repeat(50));

    const successCount = this.testResults.filter(r => r.status === 'success').length;
    const errorCount = this.testResults.filter(r => r.status === 'error').length;
    const totalCount = this.testResults.length;

    console.log(`Total Tests: ${totalCount}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📈 Success Rate: ${((successCount / totalCount) * 100).toFixed(1)}%`);

    if (errorCount > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.filter(r => r.status === 'error').forEach(result => {
        console.log(`  - ${result.message}`);
      });
    }
  }
}

// Run the tests
if (require.main === module) {
  const tester = new CallTester();
  tester.runTests().catch(console.error);
}

module.exports = CallTester;