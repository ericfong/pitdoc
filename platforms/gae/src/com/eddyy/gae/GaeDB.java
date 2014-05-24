package com.eddyy.gae;

import java.io.InputStream;
import java.io.OutputStream;
import java.util.Set;

import com.eddyy.common.DB;
import com.eddyy.common.Type;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.EntityNotFoundException;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.datastore.Text;
import com.google.appengine.api.datastore.Transaction;

public class GaeDB extends DB {
    private DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    
    @Override
    protected boolean _has(Type type, String id) {
        try {
            Entity entity = datastore.get(KeyFactory.createKey(type.toString(), id));
            return entity != null;
        } catch (EntityNotFoundException e) {
        }
        return false;
    }

    @Override
    protected String _get(Type type, String id) {
        try {
            Entity entity = datastore.get(KeyFactory.createKey(type.toString(), id));
            String json = ((Text) entity.getProperty("value")).getValue();
            return json;
        } catch (EntityNotFoundException e) {
        }
        return null;
    }

    @Override
    protected void _put(Type type, String id, String value) {
        Entity entity = new Entity(KeyFactory.createKey(type.toString(), id));
        entity.setProperty("value", new Text(value));
        datastore.put(entity);
    }

    @Override
    protected boolean _hasFile(String filename) {
        throw new UnsupportedOperationException();
    }

    @Override
    protected InputStream _getFile(String filename) {
        throw new UnsupportedOperationException();
    }

    @Override
    protected OutputStream _putFile(String filename) {
        throw new UnsupportedOperationException();
    }

    @Override
    public boolean mix(Type type, String id, String field, JsonNode value) {
        Transaction txn = this.datastore.beginTransaction();
        try {
            
            ObjectNode obj = getObj(type, id);
            if (obj == null)
                obj = JSON.createObjectNode();
            obj.put(field, value);
            put(type, id, obj);
            
            txn.commit();
            return true;
        } catch (Exception e) {
            return false;
        } finally {
            if (txn.isActive())
                txn.rollback();
        }
    }

    @Override
    public boolean writeMaster(String treeId, String newMasterId, Set<String> canCommitIds) {
        Transaction txn = this.datastore.beginTransaction();
        try {
            String oldMasterIdLock = get(Type.master, treeId);
            if (!newMasterId.equals(oldMasterIdLock)  && canCommitIds.contains(oldMasterIdLock)) {
                put(Type.master, treeId, newMasterId);
                txn.commit();
            }
            return true;
        } catch (Exception e) {
            return false;
        } finally {
            if (txn.isActive())
                txn.rollback();
        }
    }
    
    
//    public void setNamespace(String dir) {
//        NamespaceManager.set(dir);
//    }
//    private Key createKey(String path) {
//        if (path.charAt(0) == '/')
//            path = path.substring(1);
//        String kind, key, ancestorKind = null, ancestorKey = null;
//        int kindI = path.lastIndexOf('.');
//        if (kindI > 0) {
//            kind = path.substring(kindI + 1);
//            key = path.substring(0, kindI);
//        } else {
//            throw new RuntimeException("Bad path: "+path);
//        }
//        int dirI = key.lastIndexOf("_/");
//        if (dirI > 0) {
//            String ancestorPath = key.substring(0, dirI);
//            int ancestorKindI = ancestorPath.lastIndexOf('.');
//            if (ancestorKindI > 0) {
//                ancestorKind = ancestorPath.substring(ancestorKindI + 1);
//                ancestorKey = ancestorPath.substring(0, ancestorKindI);
//                key = key.substring(dirI + 2);
//            }
//        }
//        if (ancestorKind != null && ancestorKey != null)
//            return KeyFactory.createKey(KeyFactory.createKey(ancestorKind, ancestorKey), kind, key);
//        else
//            return KeyFactory.createKey(kind, key);
//    }
//    public ObjectNode extendFile(String targetPath) {
//        Transaction txn = this.datastore.beginTransaction();
//        
//        // TODO: need to call release locking?
//        long maxTime = 0;
//        // read tree
//        ObjectNode tree =  Util.parseObject(get(targetPath));
//        if (tree == null) {
//            tree = JSON.createObjectNode();
//            maxTime = 1;
//        }
//
//        Query q = new Query("t", createKey(targetPath));
//        PreparedQuery pq = this.datastore.prepare(q);
//        for (Entity entity : pq.asIterable()) {
//            String json = ((Text) entity.getProperty("value")).getValue();
//
//            maxTime = Math.max(maxTime, extendTmp(tree, json));
//        }
//        
//        // write
//        if (maxTime > 0) {
//            System.out.println("ExtendTree\t " + targetPath);
//            put(targetPath, tree.toString());
//            //setMtime(targetPath, maxTime);
//
//            txn.commit();
//        } else {
//            txn.rollback();
//        }
//        for (Entity entity : pq.asIterable()) {
//            Key tmpDbKey = entity.getKey();
//            this.datastore.delete(tmpDbKey);
//        }
//        return maxTime > 0 ? tree : null;
//    }
}
