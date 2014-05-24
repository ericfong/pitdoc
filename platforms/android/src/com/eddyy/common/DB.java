package com.eddyy.common;

import java.io.InputStream;
import java.io.OutputStream;
import java.util.Set;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

public abstract class DB {
    protected ObjectMapper JSON = new ObjectMapper();
    
    protected abstract boolean _has(Type type, String id);
    protected abstract String _get(Type type, String id);
    protected abstract void _put(Type type, String id, String value);
    protected abstract boolean _hasFile(String filename);
    protected abstract InputStream _getFile(String filename);
    protected abstract OutputStream _putFile(String filename);
    
    public boolean has(Type type, String id) {
        if (type == null || id == null || id.isEmpty()) return false;
        return _has(type, id);
    }
    public String get(Type type, String id) {
        if (type == null || id == null || id.isEmpty()) return null;
        return _get(type, id);
    }
    public void put(Type type, String id, String value) {
        if (type == null || id == null || id.isEmpty()) return;
        _put(type, id, value);
    }
    
    public ObjectNode getObj(Type type, String id) {
        return Util.parseObject(this.get(type, id));
    }
    public void put(Type type, String id, JsonNode value) {
        this.put(type, id, value.toString());
    }

    public boolean hasFile(String filename) {
        if (filename == null || filename.isEmpty()) return false;
        return _hasFile(filename);
    }
    public InputStream getFile(String filename) {
        if (filename == null || filename.isEmpty()) return null;
        return _getFile(filename);
    }
    public OutputStream putFile(String filename) {
        if (filename == null || filename.isEmpty()) return null;
        return _putFile(filename);
    }
    
    
    public abstract boolean mix(Type type, String id, String field, JsonNode value);
    public abstract boolean writeMaster(String treeId, String newMasterId, Set<String> canCommitIds);
    
//    protected boolean canCheckIn(String oldMasterId, String newMasterId) {
//        if (oldMasterId == null)
//            return true;
//        if (oldMasterId.equals(newMasterId))
//            return false;
//        // BFS uses Queue data structure
//        Queue<String> queue = new LinkedList<String>();
//        queue.offer(newMasterId);
//        while(!queue.isEmpty()) {
//            String commitId = queue.poll();
//            Iterator<JsonNode> pasts = ((ArrayNode) getObj(Type.commit, commitId).path("pasts")).iterator();
//            while (pasts.hasNext()) {
//                String pastId = pasts.next().asText();
//                if (oldMasterId.equals(pastId))
//                    return true;
//                queue.offer(pastId);
//            }
//        }
//        return false;
//    }
}
