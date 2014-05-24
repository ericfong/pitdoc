package com.eddyy.android_httpd;

import java.io.IOException;
import java.net.BindException;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.*;
import java.util.Map.Entry;
import java.util.regex.Pattern;

import com.pithway.doc.PithwayAppActivity;

import fi.iki.elonen.NanoHTTPD;
import fi.iki.elonen.NanoHTTPD.Response.Status;

public class Httpd extends NanoHTTPD {
    
    protected Httpd(int port) {
        super(port);
        System.setProperty("java.net.preferIPv4Stack" , "true");
    }
    
    private WebHandler createHandler() {
        if (webHandlerClass != null) {
            try {
                return webHandlerClass.newInstance();
            } catch (InstantiationException e) {
                e.printStackTrace();
            } catch (IllegalAccessException e) {
                e.printStackTrace();
            }
        }
        return new WebHandler();
    }

    private Class<? extends WebHandler> webHandlerClass;
    public void setWebHandlerClass(Class<? extends WebHandler> webHandlerClass) {
        this.webHandlerClass = webHandlerClass;
    }
    
    private PithwayAppActivity activity;
    public void setActivity(PithwayAppActivity activity) {
        this.activity = activity;
    }

    /* (non-Javadoc)
     * @see fi.iki.elonen.NanoHTTPD#serve(fi.iki.elonen.NanoHTTPD.IHTTPSession)
     */
    @Override
    public Response serve(IHTTPSession session) {
        // Copy from NanoHTTPD.serve
        Map<String, String> files = new HashMap<String, String>();
        Method method = session.getMethod();
        if (Method.PUT.equals(method) || Method.POST.equals(method)) {
            try {
                session.parseBody(files);
            } catch (IOException ioe) {
                return new Response(Response.Status.INTERNAL_ERROR, MIME_PLAINTEXT, "SERVER INTERNAL ERROR: IOException: " + ioe.getMessage());
            } catch (ResponseException re) {
                return new Response(re.getStatus(), MIME_PLAINTEXT, re.getMessage());
            }
        }
        
        // Override to customize the server.
        Response res;
        try {
            
            WebHandler handler = createHandler();
            handler.init(activity, session);
            
            // Process session and cookie before get into handler to match with the env in GAE servlet 
            handler.handle(method.toString(), session.getUri(), session.getParms(), session.getHeaders(), files);
            
            // resStatus int to Status
            int resStatus = handler.getResStatus();
            Status status = null;
            for (Status s : Status.values()) {
                if (s.getRequestStatus() == resStatus) {
                    status = s;
                    break;
                }
            }
            
            // build Response
            res = new Response(status, handler.getResMime(), handler.getResBodyStream());
            for (Entry<String, String> entry : handler.getResHeaders().entrySet())
                res.addHeader(entry.getKey(), entry.getValue());
            
        } catch(Exception e) {
            e.printStackTrace();
            res = new Response(Response.Status.INTERNAL_ERROR, MIME_PLAINTEXT, "Error opps");
        }
        return res;
    }

    
    
    
    
    private static Httpd httpd;
    private static int httpdPortTrial = 2;
    public static Httpd getHttpd() {
        return httpd;
    }
    public static Httpd startup() {
        if (httpd != null)
            shutdown();
        
        // get port number
        int httpdPort;
        if (httpdPortTrial <= 9) {
            String p = httpdPortTrial+"";
            httpdPort = Integer.parseInt(p+p+p+p);
        } else if (httpdPortTrial <= 14) {
            String p = (httpdPortTrial - 9)+"";
            httpdPort = Integer.parseInt(p+p+p+p+p);
        } else if (httpdPortTrial <= 20) {
            httpdPort = 0;
        } else {
            System.err.println("Couldn't start server: Don't have available port.");
            httpd = null;
            return null;
        }
        //System.out.println("Try port "+this.httpdPort);
        
        try {
            httpd = new Httpd(httpdPort);
            httpd.start();
            
//            // Register httpd to the NSD
//            nsdHelper.registerService(httpd.getListeningPort());
            
        } catch (BindException be) {
            httpdPortTrial++;
            // recursive try
            startup();
        } catch (IOException ioe) {
            System.err.println("Couldn't start server: "+ioe);
            httpd = null;
            return null;
        }
        return httpd; 
    }
    public static void shutdown() {
        if (httpd != null) {
//            nsdHelper.unregisterService();
            httpd.stop();
            httpd = null;
        }
    }
    public static String getHostname() {
        String hostname = null;
        System.setProperty("java.net.preferIPv4Stack" , "true");
        Pattern ipPattern = Pattern.compile("\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}");
        try {
            for (Enumeration<?> en = NetworkInterface.getNetworkInterfaces(); en.hasMoreElements() && hostname == null;) {
                NetworkInterface intf = (NetworkInterface) en.nextElement();
                for (Enumeration<?> enumIpAddr = intf.getInetAddresses(); enumIpAddr.hasMoreElements() && hostname == null;) {
                    InetAddress inetAddress = (InetAddress) enumIpAddr.nextElement();
                    if (!inetAddress.isLoopbackAddress()) {
                        String ipStr = inetAddress.getHostAddress().toString();
                        if (ipPattern.matcher(ipStr).matches()) {
                            hostname = ipStr;
                        }
                    }
                }
            }
        } catch (SocketException ex) {
            ex.printStackTrace();
        }
        return hostname;
    }
    public static Set<String> getHostnames() {
        Set<String> hostnames = new HashSet<String>();
        System.setProperty("java.net.preferIPv4Stack" , "true");
        Pattern ipPattern = Pattern.compile("\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}");
        try {
            for (Enumeration<?> en = NetworkInterface.getNetworkInterfaces(); en.hasMoreElements();) {
                NetworkInterface intf = (NetworkInterface) en.nextElement();
                for (Enumeration<?> enumIpAddr = intf.getInetAddresses(); enumIpAddr.hasMoreElements();) {
                    InetAddress inetAddress = (InetAddress) enumIpAddr.nextElement();
                    String ipStr = inetAddress.getHostAddress().toString();
                    if (ipPattern.matcher(ipStr).matches()) {
                        hostnames.add(ipStr);
                    }
                }
            }
        } catch (SocketException ex) {
            ex.printStackTrace();
        }
        return hostnames;
    }
    public static String getHost() {
        return Httpd.getHostname()+":"+Httpd.getPort();
    }
    public static Set<String> getHosts() {
        Set<String> hosts = new HashSet<String>();
        for (String hostname : Httpd.getHostnames()) {
            hosts.add(hostname+":"+Httpd.getPort());
        }
        return hosts;
    }
    public static int getPort() {
        if (httpd != null)
            return httpd.getListeningPort();
        return -1;
    }
}
