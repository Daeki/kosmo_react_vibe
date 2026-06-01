package com.vibe.kosmo;

import java.net.InetSocketAddress;
import java.net.Socket;

public class TestSocket {
    public static void main(String[] args) {
        String host = "aws-1-ap-northeast-2.pooler.supabase.com";
        int port = 6543;
        int timeout = 5000;
        
        System.out.println("Supabase PostgreSQL 서버 접속 시도: " + host + ":" + port);
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), timeout);
            System.out.println("데이터베이스 서버 네트워크 연결 성공!");
        } catch (Exception e) {
            System.err.println("데이터베이스 서버 네트워크 연결 실패: " + e.getMessage());
        }
    }
}
