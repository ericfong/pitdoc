package com.eddyy.android_httpd;

import java.util.*;
import java.util.Map.Entry;
import java.util.concurrent.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

public enum Sync {
    INSTANCE;
    
    private ObjectMapper JSON = new ObjectMapper();
    
    //private ThreadPoolExecutor pool = new ThreadPoolExecutor(1, 1, 0L, TimeUnit.MILLISECONDS, new LinkedBlockingQueue<Runnable>());
    private ScheduledThreadPoolExecutor pool = new ScheduledThreadPoolExecutor(1);
    private Map<String, Syncer> syncers = new HashMap<String, Syncer>();
    
    public void addServerHost(final String serverHost) {
        synchronized(syncers) {
            if (!syncers.containsKey(serverHost)) {
                Syncer syncer = new Syncer(serverHost);
                syncers.put(serverHost, syncer);
                execute(syncer, null);
            }
        }
    }
    public void removeServerHost(final String serverHost) {
        synchronized(syncers) {
            syncers.remove(serverHost);
        }
    }
    private void pushTo(final String serverHost) {
        synchronized(syncers) {
            Syncer syncer = syncers.get(serverHost);
            if (syncer != null)
                execute(syncer, null);
        }
    }
    public void pushAll() {
        synchronized(syncers) {
            if (syncers.size() > 0) {
                Iterator<Entry<String, Syncer>> iter = syncers.entrySet().iterator();
                while (iter.hasNext()) {
                    Entry<String, Syncer> entry = iter.next();
                    Syncer syncer = entry.getValue();
                    if (syncer.isBadServer()) {
                        iter.remove();
                        continue;
                    }
                    execute(syncer, null);
                }
            }
        }
    }
    public void checkAll() {
        synchronized(syncers) {
            if (syncers.size() > 0) {
                Iterator<Entry<String, Syncer>> iter = syncers.entrySet().iterator();
                while (iter.hasNext()) {
                    Entry<String, Syncer> entry = iter.next();
                    Syncer syncer = entry.getValue();
                    if (syncer.isBadServer()) {
                        iter.remove();
                        continue;
                    }
                    if (syncer.shouldRun()) {
                        execute(syncer, null);
                    }
                }
            }
        }
    }
//    public void pushOut(ObjectNode targets, ObjectNode pushs) {
//        if (targets.size() == 0 || pushs.size() == 0)
//            return;
//        synchronized(syncers) {
//            if (syncers.size() == 0)
//                return;
//            Iterator<String> fields = targets.fieldNames();
//            while (fields.hasNext()) {
//                String serverHost = fields.next();
//                Syncer syncer = syncers.get(serverHost);
//                if (syncer != null) {
//                    if (syncer.isBadServer()) {
//                        syncers.remove(serverHost);
//                        continue;
//                    }
//                    execute(syncer, pushs);
//                }
//            }
//        }
//    }
    private void execute(Syncer syncer, ObjectNode nextPushs) {
        boolean success = syncer.setNextPushs();
        if (success && !pool.getQueue().contains(syncer)) {
            pool.schedule(syncer, 500, TimeUnit.MILLISECONDS);
        }
    }

    
    
    private Map<String, ObjectNode> onlines = new HashMap<String, ObjectNode>();
    private Map<String, Long> onlineTimes = new HashMap<String, Long>();
    // 10 second for browser to poll
    public long actveTime = 10*1000;
    
    public void addOnline(ObjectNode account) {
        if (account == null)
            return;
        String id = account.path("id").textValue();
        if (id == null)
            return;
        onlineTimes.put(id, System.currentTimeMillis());
        ObjectNode old = onlines.get(id);
        // no old
        if (old == null) {
            onlines.put(id, account);

            this.pushAll();
            Sessions.INSTANCE.appNotify("addOnline", id);
        }
    }
    public ObjectNode getOnlines() {
        ObjectNode ret = JSON.createObjectNode();
        long now = System.currentTimeMillis();
        synchronized(onlines) {
            for(Iterator<Entry<String, Long>> iter = onlineTimes.entrySet().iterator(); iter.hasNext(); ) {
                Entry<String, Long> entry = iter.next();
                String id = entry.getKey();
                long time = entry.getValue();
                if (now - time > actveTime) {
                    // expired
                    iter.remove();
                    onlines.remove(id);
                } else {
                    ObjectNode account = onlines.get(id);
                    ret.put(id, account);
                }
            }
        }
        return ret;
    }
    
    
    
    private ObjectNode peerOnlines = JSON.createObjectNode();
    
    public ObjectNode handlePushContext(String sourceIp, ObjectNode input, ObjectNode output) {
        int sourcePort = input.get("httpdPort").intValue();
        if (sourcePort > 0) {
            String sourceHost = sourceIp+":"+sourcePort;
            
            // onlines
            ObjectNode onlines = input.with("onlines");
            synchronized(peerOnlines) {
                if (peerOnlines.path(sourceHost).size() != onlines.size()) {
                    // FIXME: still valid?
                    // because push tree will be diff when other server have diff onlines
                    this.pushTo(sourceHost);
                } 
                peerOnlines.put(sourceHost, onlines);
                System.out.println("GainContext\t "+peerOnlines);
            }
            
            
            // push back (better to do that after gotClients updated)
            this.addServerHost(sourceHost);
            // servers changed
            Sessions.INSTANCE.appNotify("peerOnline", sourceHost);
            
            
//            // request source to push when we don't have or older then the source
//            Map<String, Long> ourMtimes = FileDB.db.getTreeMtimes();
//            Iterator<Entry<String, JsonNode>> iter = input.with("trees").fields();
//            while (iter.hasNext()) {
//                Entry<String, JsonNode> entry = iter.next();
//                String treePath = entry.getKey();
//                if (ourMtimes.containsKey(treePath)) {
//                    long sourceTreeMtime = entry.getValue().longValue();
//                    long ourTreeMtime = ourMtimes.get(treePath);
//                    if (sourceTreeMtime > ourTreeMtime) {
//                        // request push tree
//                        output.put(treePath, ourTreeMtime);
//                    }
//                } else {
//                    // don't have
//                    output.put(treePath, true);
//                }
//            }
        }
        return output;
    }
    
    // for handleConnect
    public ObjectNode getServersClients() {
        synchronized(peerOnlines) {
            return peerOnlines;
        }
    }
    
//    protected boolean isServerHasClients(String lookForServer, ObjectNode lookForClients) {
//        synchronized(peerOnlines) {
//            ObjectNode server = (ObjectNode) peerOnlines.get(lookForServer);
//            if (server == null)
//                return false;
//            // targetClients in this server?
//            Iterator<String> serverClientIds = server.fieldNames();
//            while (serverClientIds.hasNext()) {
//                String serverClientId = serverClientIds.next();
//                if (lookForClients.has(serverClientId)) {
//                    return true;
//                }
//            }
//        }
//        return false;
//    }
    
    public void shutdown(){
        pool.shutdown(); // Disable new tasks from being submitted
        try {
            // Wait a while for existing tasks to terminate
            if (!pool.awaitTermination(60, TimeUnit.SECONDS)) {
                pool.shutdownNow(); // Cancel currently executing tasks
                // Wait a while for tasks to respond to being cancelled
                if (!pool.awaitTermination(60, TimeUnit.SECONDS))
                    System.err.println("Pool did not terminate");
            }
        } catch (InterruptedException ie) {
            // (Re-)Cancel if current thread also interrupted
            pool.shutdownNow();
            // Preserve interrupt status
            Thread.currentThread().interrupt();
        }
    }
}
