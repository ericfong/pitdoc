package com.eddyy.android_httpd;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.ConnectException;
import java.nio.charset.Charset;

import org.apache.commons.io.IOUtils;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPut;
import org.apache.http.client.methods.HttpUriRequest;
import org.apache.http.entity.ByteArrayEntity;
import org.apache.http.impl.client.DefaultHttpClient;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

public class Http {
    
    private static DefaultHttpClient httpClient = new DefaultHttpClient();
    private static ObjectMapper JSON = new ObjectMapper();
    private static final Charset UTF8_CHARSET = Charset.forName("UTF-8");
    
    public static ObjectNode ajax(String url, ObjectNode body) {
        try {
            String response = ajax(url, body.toString(), "application/json");
            if (response == null)
                return null;
            return (ObjectNode) JSON.readTree( response );
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }
    
    public static String ajax(String url, String body) {
        return ajax(url, body, "text/plain");
    }

    public static String ajax(String url, String body, String contentType) {
        try {
            InputStream ret = ajax(url, body.getBytes("UTF-8"), contentType);
            if (ret == null)
                return null;
            return IOUtils.toString(ret, UTF8_CHARSET);
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }
    
    public static InputStream ajax(String url, byte[] body, String contentType) {
        return ajax(url, body, contentType, 0);
    }
    
    public static InputStream ajax(String url, byte[] body, String contentType, int trial) {
        HttpUriRequest request;
        if (body == null) {
            // GET
            request = new HttpGet(url);
        } else {
            // PUT
            ByteArrayEntity input = new ByteArrayEntity(body);
            input.setContentType(contentType);
            
            HttpPut putRequest = new HttpPut(url);
            putRequest.setEntity(input);
            request = putRequest;
        }
    
        //System.out.println("Http.ajax: "+ url);
        
        // response
        InputStream ret = null;
        try {
            HttpResponse response = httpClient.execute(request);
            HttpEntity resEntity = response.getEntity();
            if (resEntity != null && response.getStatusLine().getStatusCode() == 200) {
                InputStream result = resEntity.getContent();
                // TODO: use file instead
                byte[] tmp = IOUtils.toByteArray(result);
                ret = new ByteArrayInputStream(tmp);
            } else {
                if (resEntity == null) {
                    System.err.println("Http.ajax fail resEntity == null");
                } else {
                    if (trial <= 0 && response.getStatusLine().getStatusCode() == 500) {
                        // retry when 500
                        return ajax(url, body, contentType, trial+1);
                    } else {
                        System.err.println("Http.ajax fail "+ response.getStatusLine().getStatusCode() +" : "+ IOUtils.toString(resEntity.getContent(), UTF8_CHARSET) );
                    }
                }
            }
            if (resEntity != null)
                resEntity.consumeContent();
        } catch (ConnectException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return ret;

        // get cookieStore
        // CookieStore cookieStore = httpClient.getCookieStore();
        // get Cookies
        // List<Cookie> cookies = cookieStore.getCookies();
    }
}
