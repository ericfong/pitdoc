package com.eddyy.common;

import java.io.InputStream;
import java.util.*;
import java.util.Map.Entry;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

public abstract class Handler extends HandlerAPI {
    // Tree is Encrypt-able File DB, Server always receive and trash, will become Commit or Suggestion-Accept 
    @Override
    protected boolean route() {        
        if (reqUri.equals("/connect")) {
            return setResJson( this.connect( getReqJson() ) );
        }
        if (reqUri.equals("/poll")) {
            return setResJson( this.poll( getReqJson() ) );
        }
        if (reqUri.equals("/pull")) {
            return setResJson( this.pull( getReqJson() ) );
        }
        
        if (reqUri.startsWith("/isMissing")) {
            return setResJson( this.isMissing( getReqJson() ) );
        }
        if (reqUri.equals("/push")) {
            return setResJson( this.push( getReqJson() ) );
        }

        if (reqUri.equals("/login")) {
            return setResString( this.loginOrSignup( getReqJson() , true, false) );
        }
        if (reqUri.equals("/signup")) {
            return setResString( this.loginOrSignup( getReqJson() , false, true) );
        }
        if (reqUri.equals("/loginOrSignup")) {
            return setResString( this.loginOrSignup( getReqJson() , false, false) );
        }
//        if (reqUri.equals("/accountIdAvailable")) {
//            return setResJson( this.accountIdAvailable( getReqJson() ) );
//        }
        
        // redirections
        if (reqUri.startsWith("/view-")) {
            // original
            InputStream stream = this.getAsset("index.html");
            String indexStr = stream != null ? Util.inputStreamToString(stream) + "\n" : "\n";
            //writer.write();
            this.setOK(indexStr, "text/html");
        }
        
        return false;
    }
    
    
    protected ObjectNode connect(ObjectNode input) {
        if (input == null) return null;
        Set<String> accountIds = getAccountIds();
        accountIds.clear();
        
        ObjectNode output = JSON.createObjectNode();
        Iterator<Entry<String, JsonNode>> fields = input.fields();
        while (fields.hasNext()) {
            Entry<String, JsonNode> field = fields.next();
            output.put(field.getKey(), loginOrSignup((ObjectNode) field.getValue(), false, false));
        }
        
        return output;
    }
    protected String loginOrSignup(ObjectNode input, boolean isLoginOnly, boolean isSignupOnly) {
        if (input == null) return null;
        String accountId = input.path("_id").textValue();
        if (accountId == null || accountId.isEmpty())
            return "Account Id Is Empty";
        accountId = accountId.toLowerCase();
        String passkey = input.path("passkey").asText();

        String dbPasskey = db.get(Type.pass, accountId);
        if (dbPasskey == null) {
            if (isLoginOnly) {
                return "Account Id Not Exist";
            } else {
                db.put(Type.pass, accountId, passkey);
            }
        } else {
            if (isSignupOnly) {
                return "Account Id Used";
            } else {
                if (dbPasskey != null && !dbPasskey.isEmpty() && !dbPasskey.equals(passkey)) {
                    return "Passkey Not Match";
                }
            }
        }
        
        getAccountIds().add( accountId );
        return "OK";
    }
//    protected ObjectNode accountIdAvailable(ObjectNode input) {
//        if (input == null) return null;
//        String accountId = input.path("_id").textValue();
//        accountId = accountId.toLowerCase(Locale.US);
//        ObjectNode output = JSON.createObjectNode();
//        output.put("ok", !db.has(Type.pass, accountId) );
//        return output;
//    }
//    private ObjectNode connectCheck(String accountId, String passkey) {
//        ObjectNode result = JSON.createObjectNode();
//        String dbkey = db.get(Type.pass, accountId);
//        if (dbkey == null) {
//            // user not register -> Create Account
//            db.put(Type.pass, accountId, passkey);
//            //db.put(Type.acct, accountId, "{}");
//        } else {
//            // userId taken -> Login
//            if (passkey == null || !passkey.equals(dbkey)) {
//                result.with("errors").put("passkeyNotMatch", true);
//            }
//        }
//        return result;
//    }
    

    protected ObjectNode poll(ObjectNode input) {
        if (input == null) return null;
        
        ObjectNode output = JSON.createObjectNode();
        ObjectNode oTrees = output.with("trees");

        ObjectNode watchIds = input.with("watchIds");
        
        watchIds.putAll(getAccountTreeIds());
        
        Iterator<String> iter = watchIds.fieldNames();
        while (iter.hasNext()) {
            String treeId = iter.next();
            // for watchIds, even db don't have this tree, still return {}, so that client will push to here
            ObjectNode oTree = oTrees.with(treeId);
            oTree.put("master", db.get(Type.master, treeId));
            oTree.put("members", db.getObj(Type.members, treeId));
            onPoll(oTree, treeId);
        }
        
        return output;
    }
    protected void onPoll(ObjectNode oTree, String treeId) {
    }

    protected ObjectNode getAccountTreeIds() {
        ObjectNode ret = JSON.createObjectNode();
        Set<String> accountIds = getAccountIds();
        if (accountIds == null || accountIds.isEmpty()) {
            return ret;
        }
        for (String accountId : accountIds) {
            ObjectNode acct = db.getObj(Type.inbox, accountId);
            if (acct != null) {
                Iterator<String> iter = acct.fieldNames();
                while (iter.hasNext()) {
                    String treeId = iter.next();
                    ret.put(treeId, true);
                }
            }
        }
        return ret;
    }
    protected ObjectNode pull(ObjectNode input) {
        if (input == null) return null;
        ObjectNode output = JSON.createObjectNode();
        _handlePull(input, output, "commit");
        _handlePull(input, output, "node");
        _handlePull(input, output, "res");
        // counting reading nodes here?
        return output;
    }
    private void _handlePull(ObjectNode req, ObjectNode res, String field) {
        ObjectNode pullRes = res.with(field);
        Iterator<String> pullReqIter = req.with(field).fieldNames();
        while (pullReqIter.hasNext()) {
            String key = pullReqIter.next();
            Type type = Type.lookup(field);
            pullRes.put(key, db.getObj(type, key));
        }
    }

    
    private ObjectNode isMissing(ObjectNode input) {
        if (input == null) return null;
        ObjectNode output = JSON.createObjectNode();
        Iterator<Entry<String, JsonNode>> types = input.fields();
        while (types.hasNext()) {
            Entry<String, JsonNode> entry = types.next();
            String typeStr = entry.getKey();
            Type type = Type.lookup(typeStr);
            if (type != null) {
                ObjectNode out = output.with(typeStr);
                
                Iterator<String> ids = entry.getValue().fieldNames();
                while (ids.hasNext()) {
                    String id = ids.next();
                    if (id.isEmpty() || id.equals("null") || id.equals("undefined"))
                        continue;
                    
                    if (!db.has(type, id)) {
                        out.put( id, 2 );
                    }
                }
            }
        }
        return output;
    }
    private ObjectNode push(ObjectNode input) {
        if (input == null) return null;
        String treeId = input.path("treeId").asText();
        String authorId = input.path("authorId").asText();
        ObjectNode output = JSON.createObjectNode();
        if (treeId == null || authorId == null) {
            output.put("error", "treeId or authorId is empty");
            return output;
        }
        authorId = authorId.trim().toLowerCase(Locale.US);
        
        Set<String> accountIds = getAccountIds();
        if (!accountIds.contains(authorId)) {
            output.put("error", "Cannot Login");
            return output;
        }
        
        // accountId has permission for treeId ?
        ObjectNode tperm = db.getObj(Type.rights, treeId);
        if (tperm != null) {
            String role = tperm.path(authorId).asText();
            if (role == null){
                output.put("error", "No Permission");
                return output;
            }
        }
        
        Iterator<Entry<String, JsonNode>> members = input.with("members").fields();
        while (members.hasNext()) {
            Entry<String, JsonNode> entry = members.next();
            String memberId = entry.getKey();
            boolean result = db.mix(Type.members, treeId, memberId, entry.getValue());
            db.mix(Type.inbox, memberId, treeId, Util.parseJson("true"));
            output.put("members", result);
        }
        
        String newMasterId = input.path("master").textValue();
        if (newMasterId != null && !newMasterId.isEmpty()) {
            String oldMasterId = db.get(Type.master, treeId);
            if (!newMasterId.equals(oldMasterId)) {
                JsonNode commitTable = input.path("commit");
                JsonNode nodeTable = input.path("node");
                Set<String> canIds = canCommitIds(oldMasterId, newMasterId, commitTable, nodeTable);
                if (canIds != null) {

                    // counting writing nodes here?
                    Iterator<Entry<String, JsonNode>> commits = commitTable.fields();
                    while (commits.hasNext()) {
                        Entry<String, JsonNode> entry = commits.next();
                        db.put(Type.commit, entry.getKey(), entry.getValue());
                    }
                    Iterator<Entry<String, JsonNode>> nodes = nodeTable.fields();
                    while (nodes.hasNext()) {
                        Entry<String, JsonNode> entry = nodes.next();
                        db.put(Type.node, entry.getKey(), entry.getValue());
                    }
                    
                    boolean result = db.writeMaster(treeId, newMasterId, canIds);
                    output.put("master", result);                    
                }
            }
        } 
            
        return output;
    }
    private Set<String> canCommitIds(String oldMasterId, String newMasterId, JsonNode commitTable, JsonNode nodeTable) {
        Set<String> canIds = new HashSet<String>();
        canIds.add(oldMasterId);
        
        ObjectNode oldMasterData = db.getObj(Type.commit, oldMasterId);
        if (oldMasterData == null) {
            // broken commit, can always overwrite
            return canIds;
        }
        long refTime = oldMasterData.path("time").asLong();
        if (refTime <= 0) {
            // broken commit, can always overwrite
            return canIds;
        }
        
        // TODO: NOT SO SURE IT IS NEEDED 
        // some client may be wrong in timestamp, give them 1 day buffer
        refTime = refTime - (24*3600*1000);
        
        Queue<String> queue = new LinkedList<String>();
        canIds.add(newMasterId);
        queue.add(newMasterId);
        while(!queue.isEmpty()) {
            String id = queue.remove();
            ObjectNode data = getTmpOrDbCommit(id, commitTable);
            
            if (data == null || !checkNode(data.path("node").textValue(), nodeTable)) {
                // whole package is broken! Exception?
                return null;
            }
            
            // TODO: NOT SO SURE IT IS NEEDED 
            if (data.path("time").asLong() < refTime)
                continue;
                
            ArrayNode pasts = (ArrayNode) data.get("pasts");
            if (pasts != null) {
                Iterator<JsonNode> pastsIter = pasts.iterator();
                while (pastsIter.hasNext()) {
                    String pastId = pastsIter.next().asText();
                    if (pastId.equals(oldMasterId)) {
                        return canIds;
                    }
                    canIds.add(pastId);
                    queue.offer(pastId);
                }
            }
        }
        return null;
    } 
    private ObjectNode getTmpOrDbCommit(String commitId, JsonNode commitTable) {
        JsonNode data = commitTable.get(commitId);
        if (data == null)
            return db.getObj(Type.commit, commitId);
        if (data.isObject())
            return (ObjectNode) data;
        return null;
    } 
    private boolean checkNode(String nodeId, JsonNode nodeTable) {
        if (nodeId == null || nodeId.isEmpty() || nodeId.equals("null") || nodeId.equals("undefined"))
            return false;
        JsonNode data = nodeTable.get(nodeId);
        
        if (data == null) {
            // in DB?
            return db.has(Type.node, nodeId);
        }
        
        ArrayNode subs = (ArrayNode) data.get("subs");
        if (subs != null) {
            Iterator<JsonNode> subsIter = subs.iterator();
            while (subsIter.hasNext()) {
                String subId = subsIter.next().asText();
                if (!checkNode(subId, nodeTable)) {
                    return false;
                }
            }
        }
        String resPath = data.path("resPath").asText();
        if (resPath != null && !resPath.isEmpty() && !db.hasFile(resPath)) {
            return false;
        }
        return true;
    }
}
