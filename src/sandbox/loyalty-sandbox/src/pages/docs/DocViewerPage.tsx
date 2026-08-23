import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  BookOpen,
  Code2,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Download,
  Terminal,
  FileText,
  Smartphone,
  Server
} from 'lucide-react';
import { getPortalContent } from '../../services/api';
import { SandboxContent } from '../../types/sandbox';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';
import { useTranslation } from '../../i18n/I18nContext';

export function DocViewerPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const [content, setContent] = useState<SandboxContent | null>(null);
  const [activeTab, setActiveTab] = useState<'docs' | 'code' | 'downloads' | 'credentials'>('docs');
  const [selectedLang, setSelectedLang] = useState<string>('swift');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const docId = Number(id || '1');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    // Set default language based on doc type
    if (docId === 5) {
      setSelectedLang('swift');
    } else if (docId === 2) {
      setSelectedLang('curl');
    } else {
      setSelectedLang('curl');
    }

    getPortalContent(id)
      .then((data) => {
        setContent(data);
      })
      .finally(() => setLoading(false));
  }, [id, docId]);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Dynamic code generators per document and per platform
  const getAvailableLanguages = () => {
    if (docId === 5) {
      // Mobile SDK Integration
      return [
        { key: 'swift', label: 'Swift (iOS)', icon: '🍏' },
        { key: 'objc', label: 'Objective-C (iOS)', icon: '🍎' },
        { key: 'kotlin', label: 'Kotlin (Android)', icon: '🤖' },
        { key: 'android_java', label: 'Java (Android)', icon: '☕' },
        { key: 'react_native', label: 'React Native', icon: '⚛️' },
        { key: 'flutter', label: 'Flutter (Dart)', icon: '🐦' },
      ];
    }
    if (docId === 2) {
      // Provisioning
      return [
        { key: 'curl', label: 'cURL (API)', icon: '🌐' },
        { key: 'swift', label: 'Swift (iOS)', icon: '🍏' },
        { key: 'kotlin', label: 'Kotlin (Android)', icon: '🤖' },
        { key: 'react_native', label: 'React Native', icon: '⚛️' },
        { key: 'flutter', label: 'Flutter', icon: '🐦' },
        { key: 'java', label: 'Java (Spring)', icon: '☕' },
      ];
    }
    // Backend API docs (Doc 1, 3, 4, 6)
    return [
      { key: 'curl', label: 'cURL', icon: '🌐' },
      { key: 'java', label: 'Java (Spring)', icon: '☕' },
      { key: 'node', label: 'Node.js', icon: '🟩' },
      { key: 'python', label: 'Python', icon: '🐍' },
      { key: 'go', label: 'Go', icon: '🔵' },
      { key: 'php', label: 'PHP', icon: '🐘' },
    ];
  };

  const getCodeSnippet = (lang: string) => {
    // 1. DOC 5: MOBILE SDK INTEGRATION
    if (docId === 5) {
      if (lang === 'swift') {
        return `//
//  SmartOtpIntegration.swift (iOS)
//  Tích hợp SmartOtpSDK cho ứng dụng Swift / SwiftUI
//

import UIKit
import SmartOtpSDK

class TransferConfirmViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
    }

    /// Thực hiện ký giao dịch và lấy mã Smart OTP 8 chữ số
    func confirmTransaction(challengeCode: String, amount: String, toAccount: String) {
        // 1. (Tùy chọn) Xác thực Face ID / Touch ID của người dùng
        SmartOtpSDK.shared.authenticateBiometrics(reason: "Xác thực để ký giao dịch chuyển tiền") { [weak self] success, error in
            guard success else {
                print("Lỗi sinh trắc học: \\(error ?? "")")
                return
            }

            // 2. Ký Thử thách và sinh mã Smart OTP (Chuẩn RFC 6287 OCRA - Offline 100%)
            if let otp = SmartOtpSDK.shared.generateOtp(
                challengeCode: challengeCode, // Ví dụ: "CHAL-994821"
                amount: amount,              // Ví dụ: "5000000"
                toAccount: toAccount         // Ví dụ: "0011004567890"
            ) {
                print("Mã Smart OTP sinh thành công: \\(otp)")
                
                // 3. Gửi OTP lên Backend để hoàn tất giao dịch
                self?.submitOtpToBackend(otp: otp, challengeCode: challengeCode)
            } else {
                print("Lỗi: Thiết bị chưa được kích hoạt hoặc sai khóa.")
            }
        }
    }

    private func submitOtpToBackend(otp: String, challengeCode: String) {
        // Gọi API backend của đối tác...
    }
}`;
      }

      if (lang === 'objc') {
        return `//
//  TransferViewController.m (iOS Objective-C)
//  Tích hợp MOSmartOtpSDK cho ứng dụng Objective-C / C++
//

#import "TransferViewController.h"
#import "MOSmartOtpSDK.h"

@implementation TransferViewController

- (void)handleConfirmTransferWithChallenge:(NSString *)challengeCode
                                    amount:(NSString *)amount
                                 toAccount:(NSString *)toAccount {
    
    // 1. Xác thực sinh trắc học Face ID / Touch ID
    [[MOSmartOtpSDK sharedInstance] authenticateBiometricsWithReason:@"Xác thực giao dịch Smart OTP"
                                                          completion:^(BOOL success, NSString * _Nullable error) {
        if (!success) {
            NSLog(@"Lỗi xác thực Face ID: %@", error);
            return;
        }
        
        // 2. Ký số chuỗi thử thách và sinh mã OTP 8 chữ số (RFC 6287 OCRA)
        NSString *otp = [[MOSmartOtpSDK sharedInstance] generateOtpWithChallenge:challengeCode
                                                                          amount:amount
                                                                       toAccount:toAccount];
        if (otp) {
            NSLog(@"Sinh mã Smart OTP thành công: %@", otp);
            [self sendOtpToPartnerBackend:otp challenge:challengeCode];
        } else {
            NSLog(@"Lỗi sinh OTP: Thiết bị chưa được nạp Seed Key.");
        }
    }];
}

- (void)sendOtpToPartnerBackend:(NSString *)otp challenge:(NSString *)challenge {
    // Gửi OTP lên API đối tác...
}

@end`;
      }

      if (lang === 'kotlin') {
        return `//
//  TransferActivity.kt (Android Kotlin)
//  Tích hợp SmartOtpSDK cho ứng dụng Android Native
//

package vn.com.partner.app

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import vn.com.microtech.smartotp.sdk.SmartOtpSDK

class TransferActivity : AppCompatActivity() {

    private lateinit var smartOtpSDK: SmartOtpSDK

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        smartOtpSDK = SmartOtpSDK.getInstance(this)
    }

    /**
     * Ký số giao dịch và sinh mã Smart OTP (RFC 6287 OCRA - Offline-First)
     */
    fun performSignTransaction(challengeCode: String, amount: String, toAccount: String) {
        // 1. Gọi SDK ký chuỗi thử thách giao dịch
        val otp = smartOtpSDK.generateOtp(
            challengeCode = challengeCode, // "CHAL-994821"
            amount = amount,               // "5000000"
            toAccount = toAccount          // "0011004567890"
        )

        if (otp != null) {
            println("Mã Smart OTP sinh thành công: $otp")
            // 2. Gửi mã OTP lên máy chủ Backend của bạn
            verifyOtpWithBackend(otp, challengeCode)
        } else {
            println("Lỗi: Không thể sinh mã OTP (Thiết bị chưa cấp phát hoặc chưa mở khóa Keystore).")
        }
    }

    private fun verifyOtpWithBackend(otp: String, challengeCode: String) {
        // Gọi API backend...
    }
}`;
      }

      if (lang === 'android_java') {
        return `//
//  TransferActivity.java (Android Java)
//  Tích hợp SmartOtpSDK cho ứng dụng Android Java
//

package vn.com.partner.app;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import vn.com.microtech.smartotp.sdk.SmartOtpSDK;

public class TransferActivity extends AppCompatActivity {

    private SmartOtpSDK smartOtpSDK;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        this.smartOtpSDK = SmartOtpSDK.getInstance(this);
    }

    public void onConfirmTransaction(String challengeCode, String amount, String toAccount) {
        // Ký chuỗi thử thách và sinh mã Smart OTP 8 chữ số
        String otp = smartOtpSDK.generateOtp(challengeCode, amount, toAccount);

        if (otp != null) {
            System.out.println("Mã Smart OTP sinh thành công: " + otp);
            sendOtpToBackend(otp, challengeCode);
        } else {
            System.err.println("Lỗi: Không thể sinh mã OTP.");
        }
    }

    private void sendOtpToBackend(String otp, String challenge) {
        // Gửi OTP lên API...
    }
}`;
      }

      if (lang === 'react_native') {
        return `//
//  TransferScreen.tsx (React Native)
//  Tích hợp @microtec/react-native-smart-otp
//

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SmartOtp } from '@microtec/react-native-smart-otp';

export const TransferScreen = () => {
  const [otp, setOtp] = useState<string | null>(null);

  const handleSignTransaction = async () => {
    try {
      // 1. Xác thực sinh trắc học
      const bioAuth = await SmartOtp.authenticateBiometrics('Xác thực để ký giao dịch');
      if (!bioAuth) return;

      // 2. Ký chuỗi thử thách giao dịch (Offline-First)
      const generatedOtp = await SmartOtp.generateOtp(
        'CHAL-994821',      // Challenge Code
        '5,000,000 VND',    // Số tiền giao dịch
        '0011004567890 VCB' // Tài khoản thụ hưởng
      );

      setOtp(generatedOtp);
      Alert.alert('Thành Công', \`Mã Smart OTP của bạn là: \${generatedOtp}\`);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể sinh mã Smart OTP');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Xác Nhận Chuyển Tiền</Text>
      <TouchableOpacity style={styles.button} onPress={handleSignTransaction}>
        <Text style={styles.buttonText}>Ký Số & Lấy Mã OTP</Text>
      </TouchableOpacity>
      {otp && <Text style={styles.otpText}>Mã OTP: {otp}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  button: { backgroundColor: '#FF6B00', padding: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: '700' },
  otpText: { marginTop: 20, fontSize: 24, fontWeight: 'bold', color: '#0F172A', textAlign: 'center' }
});`;
      }

      if (lang === 'flutter') {
        return `//
//  transfer_page.dart (Flutter)
//  Tích hợp smart_otp_sdk Flutter Plugin
//

import 'package:flutter/material.dart';
import 'package:smart_otp_sdk/smart_otp_sdk.dart';

class TransferPage extends StatefulWidget {
  @override
  _TransferPageState createState() => _TransferPageState();
}

class _TransferPageState extends State<TransferPage> {
  String? _otp;

  Future<void> _signTransaction() async {
    // 1. Xác thực sinh trắc học
    final bool auth = await SmartOtpSDK.authenticateBiometrics(
      reason: 'Xác thực sinh trắc học cho Smart OTP',
    );
    if (!auth) return;

    // 2. Ký chuỗi thử thách và sinh mã Smart OTP (RFC 6287 OCRA)
    final String? otp = await SmartOtpSDK.generateOtp(
      challengeCode: 'CHAL-994821',
      amount: '5000000',
      toAccount: '0011004567890',
    );

    if (otp != null) {
      setState(() {
        _otp = otp;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Mã OTP: \$otp')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Xác Nhận Chuyển Tiền')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton(
              onPressed: _signTransaction,
              child: Text('Ký Số Giao Dịch & Lấy OTP'),
            ),
            if (_otp != null) ...[
              SizedBox(height: 20),
              Text('MÃ SMART OTP: \$_otp', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            ]
          ],
        ),
      ),
    );
  }
}`;
      }
    }

    // 2. DOC 2: DEVICE PROVISIONING
    if (docId === 2) {
      if (lang === 'curl') {
        return `curl -X POST "https://api.miotp.io.vn/api/v1/provision/register" \\
  -H "Content-Type: application/json" \\
  -H "X-Partner-Code: PARTNER_DEMO_01" \\
  -d '{
    "customerId": "0988123456",
    "deviceId": "DEVICE-UUID-994821-X",
    "deviceModel": "iPhone 16 Pro Max",
    "osType": "IOS"
  }'`;
      }
      if (lang === 'swift') {
        return `// Swift (iOS): Cấp phát và nạp Seed Key vào Keychain
import SmartOtpSDK

SmartOtpSDK.shared.provisionDevice(
    customerId: "0988123456",
    activationCode: "ACT-9821-X4K9",
    seedKeyHex: "a9f4c3b8e21074d6f9a0c1e8b7d5a3f2"
) { success, error in
    if success {
        print("Kích hoạt Smart OTP trên iOS thành công!")
    } else {
        print("Lỗi kích hoạt: \\(error ?? "")")
    }
}`;
      }
      if (lang === 'kotlin') {
        return `// Kotlin (Android): Cấp phát và mã hóa Seed Key vào Keystore
val sdk = SmartOtpSDK.getInstance(context)
val success = sdk.provisionDevice(
    customerId = "0988123456",
    activationCode = "ACT-9821-X4K9",
    seedKeyHex = "a9f4c3b8e21074d6f9a0c1e8b7d5a3f2"
)
if (success) {
    println("Kích hoạt Smart OTP trên Android thành công!")
}`;
      }
      if (lang === 'react_native') {
        return `// React Native: Gọi hàm kích hoạt
import { SmartOtp } from '@microtec/react-native-smart-otp';

const success = await SmartOtp.provisionDevice(
  '0988123456',
  'ACT-9821-X4K9',
  'a9f4c3b8e21074d6f9a0c1e8b7d5a3f2'
);
if (success) {
  console.log('Kích hoạt thiết bị thành công!');
}`;
      }
      if (lang === 'flutter') {
        return `// Flutter: Gọi hàm kích hoạt
import 'package:smart_otp_sdk/smart_otp_sdk.dart';

final bool success = await SmartOtpSDK.provisionDevice(
  customerId: '0988123456',
  activationCode: 'ACT-9821-X4K9',
  seedKeyHex: 'a9f4c3b8e21074d6f9a0c1e8b7d5a3f2',
);`;
      }
      return `package vn.com.partner.service;

import okhttp3.*;
import org.springframework.stereotype.Service;

@Service
public class ProvisionService {
    private final OkHttpClient client = new OkHttpClient();

    public String registerDevice(String customerId, String deviceId, String osType) throws Exception {
        String json = "{\\"customerId\\":\\"" + customerId + "\\",\\"deviceId\\":\\"" + deviceId + "\\",\\"osType\\":\\"" + osType + "\\"}";
        RequestBody body = RequestBody.create(json, MediaType.get("application/json"));
        Request request = new Request.Builder()
            .url("https://api.miotp.io.vn/api/v1/provision/register")
            .header("X-Partner-Code", "PARTNER_DEMO_01")
            .post(body)
            .build();
        try (Response response = client.newCall(request).execute()) {
            return response.body().string();
        }
    }
}`;
    }

    // 3. DOC 3: CHALLENGE INIT
    if (docId === 3) {
      if (lang === 'curl') {
        return `curl -X POST "https://api.miotp.io.vn/api/v1/challenge/init" \\
  -H "Content-Type: application/json" \\
  -H "X-Partner-Code: PARTNER_DEMO_01" \\
  -d '{
    "customerId": "0988123456",
    "transId": "TX_994820153",
    "amount": 5000000,
    "currency": "VND",
    "toAccount": "0011004567890",
    "toBank": "VCB",
    "content": "Chuyen tien thanh toan hop dong"
  }'`;
      }
      if (lang === 'java') {
        return `package vn.com.partner.service;

import okhttp3.*;
import org.springframework.stereotype.Service;

@Service
public class ChallengeService {
    private final OkHttpClient client = new OkHttpClient();

    public String createChallenge(String customerId, long amount, String toAccount) throws Exception {
        String json = String.format(
            "{\\"customerId\\":\\"%s\\",\\"amount\\":%d,\\"toAccount\\":\\"%s\\"}",
            customerId, amount, toAccount
        );
        RequestBody body = RequestBody.create(json, MediaType.get("application/json"));
        Request request = new Request.Builder()
            .url("https://api.miotp.io.vn/api/v1/challenge/init")
            .header("X-Partner-Code", "PARTNER_DEMO_01")
            .post(body)
            .build();
        try (Response res = client.newCall(request).execute()) {
            return res.body().string();
        }
    }
}`;
      }
      if (lang === 'node') {
        return `import axios from 'axios';

export async function createChallenge(customerId: string, amount: number, toAccount: string) {
  const response = await axios.post(
    'https://api.miotp.io.vn/api/v1/challenge/init',
    {
      customerId,
      transId: 'TX_' + Date.now(),
      amount,
      toAccount,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Partner-Code': 'PARTNER_DEMO_01',
      },
    }
  );
  return response.data?.data?.challengeCode;
}`;
      }
      if (lang === 'python') {
        return `import requests
import time

def init_challenge(customer_id: str, amount: int, to_account: str) -> str:
    res = requests.post(
        "https://api.miotp.io.vn/api/v1/challenge/init",
        json={
            "customerId": customer_id,
            "transId": f"TX_{int(time.time())}",
            "amount": amount,
            "toAccount": to_account
        },
        headers={"X-Partner-Code": "PARTNER_DEMO_01"}
    )
    return res.json().get("data", {}).get("challengeCode")`;
      }
      if (lang === 'go') {
        return `package main

import (
	"bytes"
	"encoding/json"
	"net/http"
)

func InitChallenge(customerId string, amount int64, toAccount string) (string, error) {
	payload := map[string]interface{}{
		"customerId": customerId,
		"amount":     amount,
		"toAccount":  toAccount,
	}
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://api.miotp.io.vn/api/v1/challenge/init", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Partner-Code", "PARTNER_DEMO_01")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	return "CHAL-994821", nil
}`;
      }
      return `<?php
require 'vendor/autoload.php';
use GuzzleHttp\\Client;

$client = new Client();
$res = $client->post('https://api.miotp.io.vn/api/v1/challenge/init', [
    'headers' => ['X-Partner-Code' => 'PARTNER_DEMO_01'],
    'json' => [
        'customerId' => '0988123456',
        'amount' => 5000000,
        'toAccount' => '0011004567890'
    ]
]);
$data = json_decode($res->getBody(), true);
$challengeCode = $data['data']['challengeCode'];
`;
    }

    // 4. DOC 4: VERIFICATION API (DEFAULT)
    if (lang === 'curl') {
      return `curl -X POST "https://api.miotp.io.vn/api/v1/otp/verify" \\
  -H "Content-Type: application/json" \\
  -H "X-Partner-Code: PARTNER_DEMO_01" \\
  -d '{
    "customerId": "0988123456",
    "challengeCode": "CHAL-994821",
    "otp": "48291037"
  }'`;
    }
    if (lang === 'java') {
      return `package vn.com.partner.service;

import okhttp3.*;
import org.springframework.stereotype.Service;

@Service
public class SmartOtpService {
    private final OkHttpClient client = new OkHttpClient();

    public boolean verifyOtp(String customerId, String challengeCode, String otp) throws Exception {
        String json = String.format(
            "{\\"customerId\\":\\"%s\\",\\"challengeCode\\":\\"%s\\",\\"otp\\":\\"%s\\"}",
            customerId, challengeCode, otp
        );
        RequestBody body = RequestBody.create(json, MediaType.get("application/json"));
        Request request = new Request.Builder()
            .url("https://api.miotp.io.vn/api/v1/otp/verify")
            .header("X-Partner-Code", "PARTNER_DEMO_01")
            .post(body)
            .build();

        try (Response response = client.newCall(request).execute()) {
            return response.isSuccessful();
        }
    }
}`;
    }
    if (lang === 'node') {
      return `import axios from 'axios';

export async function verifySmartOtp(customerId: string, challengeCode: string, otp: string): Promise<boolean> {
  try {
    const res = await axios.post(
      'https://api.miotp.io.vn/api/v1/otp/verify',
      { customerId, challengeCode, otp },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Partner-Code': 'PARTNER_DEMO_01',
        },
      }
    );
    return res.data?.succeeded === true;
  } catch (error) {
    return false;
  }
}`;
    }
    if (lang === 'python') {
      return `import requests

def verify_smart_otp(customer_id: str, challenge_code: str, otp: str) -> bool:
    res = requests.post(
        "https://api.miotp.io.vn/api/v1/otp/verify",
        json={"customerId": customer_id, "challengeCode": challenge_code, "otp": otp},
        headers={"X-Partner-Code": "PARTNER_DEMO_01"},
        timeout=5
    )
    return res.status_code == 200 and res.json().get("succeeded") is True`;
    }
    if (lang === 'go') {
      return `package main

import (
	"bytes"
	"encoding/json"
	"net/http"
)

func VerifySmartOtp(customerId, challenge, otp string) (bool, error) {
	payload := map[string]string{
		"customerId":    customerId,
		"challengeCode": challenge,
		"otp":           otp,
	}
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://api.miotp.io.vn/api/v1/otp/verify", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Partner-Code", "PARTNER_DEMO_01")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()
	return resp.StatusCode == 200, nil
}`;
    }
    return `<?php
require 'vendor/autoload.php';
use GuzzleHttp\\Client;

$client = new Client();
$response = $client->post('https://api.miotp.io.vn/api/v1/otp/verify', [
    'headers' => ['X-Partner-Code' => 'PARTNER_DEMO_01'],
    'json' => [
        'customerId' => '0988123456',
        'challengeCode' => 'CHAL-994821',
        'otp' => '48291037'
    ]
]);
$data = json_decode($response->getBody(), true);
$isSuccess = ($response->getStatusCode() === 200 && $data['succeeded'] === true);
`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '360px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #FF6B00', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
          <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>Đang tải tài liệu tích hợp...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Title & Tabs Header */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        padding: '20px 24px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
              {content?.title || 'Tài Liệu Hướng Dẫn Tích Hợp'}
            </h1>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', fontWeight: 500 }}>
              Đặc tả giao thức, mã nguồn mẫu đa nền tảng và thông số kiểm thử
            </p>
          </div>

          {/* Tab Selector */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', padding: '4px', backgroundColor: '#F1F5F9', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <button
              onClick={() => setActiveTab('docs')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                backgroundColor: activeTab === 'docs' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'docs' ? '#EA580C' : '#64748B',
                boxShadow: activeTab === 'docs' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <BookOpen style={{ width: '14px', height: '14px' }} />
              <span>{t.docs.tabGuide}</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                backgroundColor: activeTab === 'code' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'code' ? '#EA580C' : '#64748B',
                boxShadow: activeTab === 'code' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <Code2 style={{ width: '14px', height: '14px' }} />
              <span>{t.docs.tabSnippets}</span>
            </button>
            <button
              onClick={() => setActiveTab('downloads')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                backgroundColor: activeTab === 'downloads' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'downloads' ? '#EA580C' : '#64748B',
                boxShadow: activeTab === 'downloads' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <Download style={{ width: '14px', height: '14px' }} />
              <span>{t.docs.tabDownloads}</span>
            </button>
            <button
              onClick={() => setActiveTab('credentials')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                backgroundColor: activeTab === 'credentials' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'credentials' ? '#EA580C' : '#64748B',
                boxShadow: activeTab === 'credentials' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <Key style={{ width: '14px', height: '14px' }} />
              <span>Thông Số Test</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Markdown Body using MarkdownRenderer */}
      {activeTab === 'docs' && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          padding: '32px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          {content?.bodyMarkdown ? (
            <MarkdownRenderer content={content.bodyMarkdown} />
          ) : (
            <div style={{ color: '#94A3B8', textAlign: 'center', padding: '32px' }}>
              {t.docs.noContent}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Code Snippets (Platform & Step specific) */}
      {activeTab === 'code' && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          padding: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          {/* Lang selector buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {getAvailableLanguages().map((lang) => (
                <button
                  key={lang.key}
                  onClick={() => setSelectedLang(lang.key)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    backgroundColor: selectedLang === lang.key ? '#FFF7ED' : '#F8FAFC',
                    color: selectedLang === lang.key ? '#EA580C' : '#64748B',
                    border: selectedLang === lang.key ? '1px solid #FFEDD5' : '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{lang.icon}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => handleCopy('code', getCodeSnippet(selectedLang))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                cursor: 'pointer'
              }}
            >
              {copiedKey === 'code' ? <Check style={{ width: '14px', height: '14px', color: '#16A34A' }} /> : <Copy style={{ width: '14px', height: '14px' }} />}
              <span>{copiedKey === 'code' ? t.docs.codeCopied : t.docs.copyCode}</span>
            </button>
          </div>

          <pre style={{
            padding: '20px',
            borderRadius: '10px',
            backgroundColor: '#0F172A',
            color: '#F8FAFC',
            fontSize: '13px',
            fontFamily: 'JetBrains Mono, monospace',
            overflowX: 'auto',
            lineHeight: 1.6
          }}>
            {getCodeSnippet(selectedLang)}
          </pre>
        </div>
      )}

      {/* Tab 3: Downloads Hub */}
      {activeTab === 'downloads' && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          padding: '28px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              {t.docs.sdkHubTitle}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', marginBottom: 0 }}>
              {t.docs.sdkHubDesc}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* iOS SDK */}
            <div style={{ padding: '18px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>🍏</span>
                  <strong style={{ fontSize: '14px', color: '#0F172A' }}>iOS Native SDK</strong>
                  <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#E2E8F0', color: '#475569', fontWeight: 600 }}>v1.0.0</span>
                </div>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                  {t.docs.iosNativeDesc}
                </p>
              </div>
              <a
                href="/downloads/SmartOtpSDK-iOS.zip"
                download="SmartOtpSDK-iOS.zip"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                <Download style={{ width: '14px', height: '14px' }} />
                <span>{t.docs.btnDownloadZip}</span>
              </a>
            </div>

            {/* Android SDK */}
            <div style={{ padding: '18px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>🤖</span>
                  <strong style={{ fontSize: '14px', color: '#0F172A' }}>Android Native SDK</strong>
                  <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#E2E8F0', color: '#475569', fontWeight: 600 }}>v1.0.0</span>
                </div>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                  {t.docs.androidNativeDesc}
                </p>
              </div>
              <a
                href="/downloads/SmartOtpSDK-Android.zip"
                download="SmartOtpSDK-Android.zip"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#16A34A',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                <Download style={{ width: '14px', height: '14px' }} />
                <span>{t.docs.btnDownloadZip}</span>
              </a>
            </div>

            {/* React Native Package */}
            <div style={{ padding: '18px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>⚛️</span>
                  <strong style={{ fontSize: '14px', color: '#0F172A' }}>React Native Package</strong>
                  <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#E2E8F0', color: '#475569', fontWeight: 600 }}>v1.0.0</span>
                </div>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                  {t.docs.rnPackageDesc}
                </p>
              </div>
              <a
                href="/downloads/SmartOtpSDK-ReactNative.zip"
                download="SmartOtpSDK-ReactNative.zip"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                <Download style={{ width: '14px', height: '14px' }} />
                <span>{t.docs.btnDownloadZip}</span>
              </a>
            </div>

            {/* Flutter Plugin */}
            <div style={{ padding: '18px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>🐦</span>
                  <strong style={{ fontSize: '14px', color: '#0F172A' }}>Flutter Plugin</strong>
                  <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#E2E8F0', color: '#475569', fontWeight: 600 }}>v1.0.0</span>
                </div>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                  {t.docs.flutterPluginDesc}
                </p>
              </div>
              <a
                href="/downloads/SmartOtpSDK-Flutter.zip"
                download="SmartOtpSDK-Flutter.zip"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                <Download style={{ width: '14px', height: '14px' }} />
                <span>{t.docs.btnDownloadZip}</span>
              </a>
            </div>
          </div>

          {/* All Platforms Full Bundle */}
          <div style={{ padding: '18px 22px', borderRadius: '12px', backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>
                {t.docs.allSdkBundleTitle}
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                {t.docs.allSdkBundleDesc}
              </div>
            </div>

            <a
              href="/downloads/SmartOtpSDK-AllPlatforms.zip"
              download="SmartOtpSDK-AllPlatforms.zip"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 20px',
                borderRadius: '8px',
                backgroundColor: '#FF6B00',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(255, 107, 0, 0.25)'
              }}
            >
              <Download style={{ width: '15px', height: '15px' }} />
              <span>{t.docs.btnDownloadAll}</span>
            </a>
          </div>
        </div>
      )}

      {/* Tab 4: Test Account Info */}
      {activeTab === 'credentials' && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          padding: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '14px' }}>
            {t.docs.testParamsTitle}
          </h2>
          <pre style={{
            padding: '16px',
            borderRadius: '10px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            fontSize: '13px',
            fontFamily: 'JetBrains Mono, monospace',
            color: '#0F172A',
            overflowX: 'auto',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap'
          }}>
            {content?.testAccountInfo || 'Base URL: https://api.miotp.io.vn/api/v1\nPartner Code: PARTNER_DEMO_01'}
          </pre>
        </div>
      )}
    </div>
  );
}

export default DocViewerPage;

