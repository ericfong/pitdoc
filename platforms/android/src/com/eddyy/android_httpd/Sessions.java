package com.eddyy.android_httpd;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Random;
import java.util.UUID;

import org.apache.cordova.CordovaWebView;

public enum Sessions {
    INSTANCE;
    
    // 10 minutes
    private long expireTime = 10*60*1000;
    
    public final String OWNER_SESSION_ID = UUID.randomUUID().toString();
    
    // utils
    private Random random = new Random();
    
    // states 
    private Map<String, Map<String, Object>> allSessions = new HashMap<String, Map<String, Object>>();
    
    private Sessions() {
        // generate a sesson for the app
        this.generate(OWNER_SESSION_ID);
    }

    public Map<String, Object> get(String sessionId) {
        return allSessions.get(sessionId);
    }
    public Map<String, Object> getAndTouch(String sessionId) {
        Map<String, Object> session = allSessions.get(sessionId);
        if (session != null)
            this.touch(sessionId, session);
        return session;
    }
    public Map<String, Object> generate(String sessionId) {
        Map<String, Object> session = new HashMap<String, Object>(); 
        session.put("_id", sessionId);
        this.touch(sessionId, session);
        allSessions.put(sessionId, session);
        return session;
    }
    public void kill(String sessionId) {
        if (sessionId.equals(OWNER_SESSION_ID))
            return;
        allSessions.remove(sessionId);
    }
    private void touch(String sessionId, Map<String, Object> session) {
        long now = System.currentTimeMillis();
        session.put("_accessed", now);
        if (random.nextFloat() < 0.2)
            housekeep();
        if (now - lastCheckTime > expireTime) {
            // when not sync for too long, sync them
            Sync.INSTANCE.checkAll();
            lastCheckTime = now;
        }
    }
    private long lastCheckTime = 0;
    private void housekeep(){
        long now = System.currentTimeMillis();
        synchronized(allSessions) {
            for(Iterator<Entry<String, Map<String, Object>>> iter = allSessions.entrySet().iterator(); iter.hasNext(); ) {
                Entry<String, Map<String, Object>> entry = iter.next();
                String sessionId = entry.getKey();
                Map<String, Object> session = entry.getValue();
                if (sessionId.equals(OWNER_SESSION_ID))
                    continue;
                long time = (Long) session.get("_accessed");
                if (now - time > expireTime) {
                    // expired
                    iter.remove();
                }
            }
        }
    }

    

    private List<CordovaWebView> appViews = new ArrayList<CordovaWebView>();
    public void appNotify(String name, String message) {
        String js = "E.appNotify('"+name+"','"+message+"')";
        if (appViews.size() > 0) {
            for (CordovaWebView appView : appViews)
                appView.sendJavascript(js);
        } else {
            synchronized(pendingJs) {
                pendingJs += js+";\n";
            }
        }
    }
    private String pendingJs = "";
    public String flushPendingJs() {
        synchronized(pendingJs) {
            String ret = pendingJs;
            pendingJs = "";
            return ret;
        }
    }
    public void addAppClient(CordovaWebView appView) {
        appViews.add(appView);
    }
}
