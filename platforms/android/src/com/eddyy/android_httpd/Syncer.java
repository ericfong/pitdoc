package com.eddyy.android_httpd;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

public class Syncer implements Runnable {
    private ObjectMapper JSON = new ObjectMapper();

    private String serverHost;
    public Syncer(String serverHost) {
        this.serverHost = serverHost;
    }

//    private ObjectNode nextPushs = JSON.createObjectNode();
    private boolean isNextSet = false;
//    protected synchronized boolean setNextPushs(ObjectNode pushs) {
    protected synchronized boolean setNextPushs() {
//        if (pushs == null) {
//            // Full Sync
//            nextPushs = null;
//        } else if (nextPushs != null) {
//            // Partial Sync
//            nextPushs.putAll(pushs);
//        }
        
        if (isNextSet)
            // already scheduled, should not schedule again
            return false;
        isNextSet = true;
        return true;
    }
    
    private int trial = 0;
    protected boolean isBadServer() {
        return trial > 3;
    }
    
    private long lastRunTime = 0;
    protected boolean shouldRun() {
        return (System.currentTimeMillis() - lastRunTime) > 60*1000;
    }
    
    public void run() {
        pushContext();
//        ObjectNode pushs = null;
//        synchronized(this) {
//            // always Full Sync for Full Testing
//            nextPushs = null;
//            if (nextPushs == null || nextPushs.size() ==  0) {
//                // Full Sync
//                pushs = JSON.createObjectNode();
//                pushContext(pushs);
//            } else {
//                // Partial Sync
//                pushs = nextPushs.deepCopy();
//            } 
//            nextPushs = JSON.createObjectNode();
//            isNextSet = false;
//        }
//        if (pushs.size() > 0)
//            pushTrees(pushs);
        isNextSet = false;
        lastRunTime = System.currentTimeMillis();
    }
    
//    private void pushContext(ObjectNode pushs) {
    private void pushContext() {
        ObjectNode context = JSON.createObjectNode();
        // remote use the socket to determine the IP, so they just need a port of this Httpd
        context.put("httpdPort", Httpd.getPort());
        context.put("onlines", Sync.INSTANCE.getOnlines());

        
//        // FIXME: keep pending push-trees in js side
//        // Tmp solution: read all the tree and see which tree need to be pushed
//        Map<String, Long> treeMtimes = FileDB.db.getTreeMtimes();
//        ObjectNode trees = JSON.createObjectNode();
//        for (String treePath : treeMtimes.keySet()) {
//            ObjectNode tree = Util.parseJson( FileDB.db.get(treePath) );
//            if (tree == null)
//                continue;
//            ObjectNode accounts = tree.with("accounts");
//            Iterator<String> accts = accounts.fieldNames();
//            boolean shouldPush = false;
//            while (accts.hasNext() && !shouldPush) {
//                String acct = accts.next();
//                int atI = acct.indexOf('@');
//                String domain = acct.substring(atI+1);
//                if (domain.equals(this.serverHost)) {
//                    shouldPush = true;
//                }
//            }
//            if (shouldPush)
//                trees.put(treePath, treeMtimes.get(treePath));
//        }
//        context.put("trees", trees);
        
        
        ObjectNode res = Http.ajax("http://" + serverHost + "/forPushContext", context);
        System.out.println("PushContext\t "+serverHost+"\t "+context+"\t "+res);
        
        if (res != null) {
            trial = 0;
//            // target requests for push
//            if (res.size() > 0) {
//                pushs.putAll(res);
//            }
        } else {
            trial++;
        }
    }
    
//    private void pushTrees(JsonNode treeTable) {
//        String sessionId = serverHost.replaceAll("[\\.:]+", "-");
//        Map<String, String> sessionTmps = new HashMap<String, String>();
//        
//        // make first zip
//        ByteArrayOutputStream buffOut = new ByteArrayOutputStream();
//        int number = SyncUtil.makeZip(FileDB.db, treeTable, sessionId, sessionTmps, null, buffOut);
//        
//        while (number >= 0 && number <= 99999) {
//            InputStream result = Http.ajax("http://" + serverHost + "/forPushTrees", buffOut.toByteArray(), "application/zip");
//            if (result == null)
//                break;
//            
//            buffOut = new ByteArrayOutputStream();
//            number = SyncUtil.makeZip(FileDB.db, null, sessionId, sessionTmps, result, buffOut);
//        }
//        
//        if (sessionTmps.size() > 0)
//            throw new RuntimeException("Push-Only, should not have any sessionTmps or need to do zipFinish");
//    }
}
