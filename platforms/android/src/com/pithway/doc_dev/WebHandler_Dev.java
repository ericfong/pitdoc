package com.pithway.doc_dev;

import java.io.*;
import java.util.Map;

import com.eddyy.android_httpd.FileDB;
import com.eddyy.android_httpd.Httpd;
import com.eddyy.android_httpd.Sessions;
import com.eddyy.android_httpd.Sync;
import com.eddyy.android_httpd.WebHandler;

public class WebHandler_Dev extends WebHandler {

    public static File Data_Dir = new File("data");
    public static File Asset_Dir = new File("assets/www");
    public static void main(String[] args) throws IOException {
        
        Httpd.startup().setWebHandlerClass(WebHandler_Dev.class);
        int httpdPort = Httpd.getPort();
        if (httpdPort >= 0) {
            
            String dataSubDir = httpdPort+"";
            if (args.length >= 1)
                dataSubDir = args[0];
            File dbDir = new File(Data_Dir, dataSubDir);
            FileDB.setup(dbDir);
            
            if (httpdPort > 2222) {
                Sync.INSTANCE.addServerHost("127.0.0.1:2222");
            }
            
            System.out.println("Server started: port=" + httpdPort);
            System.out.println("    assetDir = " + Asset_Dir.getCanonicalPath());
            System.out.println("    dataDir = " + dbDir.getCanonicalPath());
            System.out.println("Hit Enter to stop.");

            try {
                System.in.read();
            } catch (Throwable ignored) {
            }

            Sync.INSTANCE.shutdown();
            Httpd.shutdown();
            System.out.println("Server stopped.\n");
        } else {
            System.err.println("Couldn't start server:");
            System.exit(-1);
        }
    }
    
    
    
    
    
    @Override
    protected boolean route() {
        if (reqUri.equals("/flushPendingJs")) {
            this.setOK("application/javascript");
            this.resBodyString = Sessions.INSTANCE.flushPendingJs();
            return true;
        }
        
        return super.route();
    }
    
    @Override
    protected boolean isOwner(){
        //return this.reqHeaders.get("remote-addr").equals("127.0.0.1");
        String referer = this.reqHeaders.get("referer") + "";
        return referer.contains("gen.app.html");
        //String host = this.reqHeaders.get("host");
        //return host.contains("localhost");
    }

    @Override
    protected Map<String, Object> getOrCreateReqSession() {
        if (isOwner()) {
            return Sessions.INSTANCE.getAndTouch(Sessions.INSTANCE.OWNER_SESSION_ID);
        }
        return super.getOrCreateReqSession();
    }
    
    @Override
    public InputStream getAsset(String path){
        File f = new File(Asset_Dir, path);
        try {
            return new FileInputStream(f);
        } catch (FileNotFoundException e) {
        }
        return null;
    }

    @Override
    public long getAssetLength(String path){
        File f = new File(Asset_Dir, path);
        return f.length();
    }
    
    @Override
    public long getAssetLastModified(String path){
        File f = new File(Asset_Dir, path);
        return f.lastModified();
    }    
    
//    @Override
//    protected String getFriendlyDomain() {
//        return "SonyC6603";
//    }
}
