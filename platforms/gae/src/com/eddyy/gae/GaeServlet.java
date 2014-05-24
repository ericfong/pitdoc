package com.eddyy.gae;

import java.io.IOException;
import java.io.OutputStream;
import java.util.*;
import java.util.Map.Entry;

import javax.servlet.http.*;

import org.apache.commons.io.IOUtils;


@SuppressWarnings("serial")
public class GaeServlet extends HttpServlet {
	
//    @Override
//    public void init() {
//    }
    
    public void doService(HttpServletRequest req, HttpServletResponse res) throws IOException {
        // method and url
        String method = req.getMethod();
        String url = req.getRequestURI();
        
        // copy headers
        Map<String, String> reqHeaders = new HashMap<String, String>();
        String remoteIp = req.getRemoteAddr();
        reqHeaders.put("remote-addr", remoteIp);
        reqHeaders.put("http-client-ip", remoteIp);
        
        Enumeration<?> e = req.getHeaderNames();
        while (e.hasMoreElements()) {
          String key = (String) e.nextElement();
          reqHeaders.put(key.toLowerCase(), req.getHeader(key));
        }

        // copy params
        Map<String, String> reqParams = new HashMap<String, String>();
        if (!method.equals("PUT")) {
        	Enumeration<?> e2 = req.getParameterNames();
        	while (e2.hasMoreElements()) {
        		String key = (String) e2.nextElement();
        		reqParams.put(key, req.getParameter(key));
        	}
        }
        
        // copy files
        
        
        // new and run handler
        GaeHandler handler = new GaeHandler(this.getServletContext(), req, res);
        handler.handle(method, url, reqParams, reqHeaders, null);
        
        // Status and Headers
        res.setStatus(handler.getResStatus());
        res.setContentType(handler.getResMime());
        for (Entry<String, String> entry : handler.getResHeaders().entrySet()) {
            res.addHeader(entry.getKey(), entry.getValue());
        }        
        
        // Body
        OutputStream os = res.getOutputStream();
        try {
            IOUtils.copy(handler.getResBodyStream(), os);
        } catch (IOException e3) {
        }
    }
    
    @Override
    public void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        this.doService(req, res);
    }
    @Override
    public void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {
        this.doService(req, res);
    }
    @Override
    public void doPut(HttpServletRequest req, HttpServletResponse res) throws IOException {
        this.doService(req, res);
    }
    @Override
    public void doHead(HttpServletRequest req, HttpServletResponse res) throws IOException {
        this.doService(req, res);
    }
    @Override
    public void doOptions(HttpServletRequest req, HttpServletResponse res) throws IOException {
        this.doService(req, res);
    }
}
