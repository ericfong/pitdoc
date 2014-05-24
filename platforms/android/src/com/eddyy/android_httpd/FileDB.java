package com.eddyy.android_httpd;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.locks.ReentrantLock;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.Charset;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;

import com.eddyy.common.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

public class FileDB extends DB {
    public static File dataDir;
    public static FileDB db = new FileDB();
    private static final Charset UTF8_CHARSET = Charset.forName("UTF-8");
    
    public static void setup(File iDataDir) {
        dataDir = iDataDir;
    }
    
    private String escape(String id) {
        try {
            id = FilenameUtils.getName(id);
            return URLEncoder.encode(id, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        return null;
    }
    private String getDir(Type type) {
        if (type == Type.master || type == Type.members || type == Type.rights)
            return "tree";
        if (type == Type.inbox || type == Type.pass)
            return "account";
        return type.toString();
    }

    @Override
    protected boolean _has(Type type, String id) {
        id = escape(id);
        File file = new File(dataDir, getDir(type)+"/"+id+"."+type);
        return file.exists();
    }
    @Override
    protected String _get(Type type, String id) {
        id = escape(id);
        try {
            File file = new File(dataDir, getDir(type)+"/"+id+"."+type);
            if (file.exists()) {
                return FileUtils.readFileToString(file, UTF8_CHARSET );
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }
    @Override
    protected void _put(Type type, String id, String value) {
        id = escape(id);
        try {
            File file = new File(dataDir, getDir(type)+"/"+id+"."+type);
            file.getParentFile().mkdirs();
            FileUtils.writeStringToFile(file, value, UTF8_CHARSET );
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    
    
    @Override
    protected boolean _hasFile(String filename) {
        filename = escape(filename);
        String ext = FilenameUtils.getExtension(filename);
        File file = new File(dataDir, ext+"/"+filename);
        if (file.exists()) {
            return true;
        }
        return false;
    }    
    @Override
    protected InputStream _getFile(String filename) {
        filename = escape(filename);
        try {
            String ext = FilenameUtils.getExtension(filename);
            File file = new File(dataDir, ext+"/"+filename);
            if (file.exists()) {
                return new FileInputStream(file);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }    
    @Override
    protected OutputStream _putFile(String filename) {
        filename = escape(filename);
        try {
            String ext = FilenameUtils.getExtension(filename);
            File file = new File(dataDir, ext+"/"+filename);
            file.getParentFile().mkdirs();
            return new FileOutputStream(file);
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }
    
//    private void del(String key) {
//        File file = new File(dataDir, key);
//        if (file.exists())
//            file.delete();
//    }
    

    
    public Set<String> listTreeIds() {
        Set<String> output = new HashSet<String>();
        File treesDir = new File(dataDir, "tree");
        if (treesDir.exists()) {
            Collection<File> files = FileUtils.listFiles(treesDir, new String[]{"master"}, false);
            for (File file : files) {
                output.add( FilenameUtils.getBaseName(file.getName()) );
            }
        }
        return output;
    }
    
    
    
    private static final ReentrantLock[] _locks = new ReentrantLock[32];
    static {
        for (int i = 0; i < _locks.length; i++) {
            _locks[i] = new ReentrantLock();
        }
    }
    private static ReentrantLock lock(String key) {
        ReentrantLock lock = _locks[ Math.abs(key.hashCode()) % 32 ];
        lock.lock();
        return lock;
    }

    
    
    @Override
    public boolean mix(Type type, String id, String field, JsonNode value) {
        ReentrantLock lock = lock(type+id);
        try {
            ObjectNode obj = getObj(type, id);
            if (obj == null)
                obj = JSON.createObjectNode();
            obj.put(field, value);
            put(type, id, obj);
            return true;
        } catch (Exception e) {
            return false;
        } finally {
            lock.unlock();
        }
    }
    
    @Override
    public boolean writeMaster(String treeId, String newMasterId, Set<String> canCommitIds) {
        ReentrantLock lock = lock(Type.master+treeId);
        try {
            String oldMasterIdLock = get(Type.master, treeId);
            if (!newMasterId.equals(oldMasterIdLock)  && canCommitIds.contains(oldMasterIdLock)) {
                put(Type.master, treeId, newMasterId);
                
                Sessions.INSTANCE.appNotify("masterUpdated", treeId);
            }
            return true;
        } catch (Exception e) {
            return false;
        } finally {
            lock.unlock();
        }
    }
}
