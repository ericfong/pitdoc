package com.eddyy.android_httpd;

import java.io.*;
import java.util.*;

import org.apache.commons.io.IOUtils;

import android.annotation.SuppressLint;
import android.content.res.AssetManager;

import com.eddyy.common.Handler;
import com.eddyy.common.Type;
import com.eddyy.common.Util;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.pithway.doc.PithwayAppActivity;

@SuppressLint("DefaultLocale")
public abstract class AppHandler extends Handler {

    protected PithwayAppActivity activity;
    protected AssetManager assetManager;
    
    public void init(PithwayAppActivity activity) {
        if (activity != null) {
            this.activity = activity;
            this.assetManager = activity.getAssets();
        }
        this.db = new FileDB();
    }

    @Override
    protected boolean route() {
        
        if (reqUri.equals("/token"))
            return setResJson( this.token( getReqJson() ) );
        if (matchToken())
            return true;
        
        ObjectNode output = null;
        if (reqUri.equals("/forPushContext")) {
            ObjectNode input = Util.parseObject(this.getReqBody());
            output = Sync.INSTANCE.handlePushContext(this.reqHeaders.get("http-client-ip"), input, input.with("_output"));
        } 
        if (output != null) {
            return this.setResJson(output);
        }

        
        if (super.route())
            return true;
        
        if (isOwner()) {
            if ("GET".equalsIgnoreCase(reqMethod) && !reqUri.startsWith("/web/")  && !reqUri.startsWith("/gen/")) {
                // redirection
                //String path = reqUri.replaceFirst("\\.v[T0-9a-f]{10,}\\.", ".");
                String path = reqUri;
                int extI = path.lastIndexOf('.');
                if (extI > 0) {
                    String ext = path.substring(extI + 1);
                    // FIXME: file?
                    Type type = Type.lookup(ext);
                    if (type != null) {
                        String id = path.substring(0, extI);
                        String body = db.get(type, id);
                        if (body != null) {
                            this.setOK(body);
                            return true;
                        }
                    } else {
                        this.resStatus = 200;
                        this.resMime = Util.getMime(reqUri);
                        this.resBodyStream = db.getFile(path);
                    }
                }
            }

            // Only app owner can put directly, other write by push
            if ("PUT".equals(reqMethod)) {
                this.handlePut();
                return true;
            }
        }
        
        return false;
    }
    
    protected void handlePut() {
        String path = reqUri;
        int extI = path.lastIndexOf('.');
        if (extI > 0) {
            String ext = path.substring(extI + 1);
            String id = path.substring(0, extI);
            
            Type type = Type.lookup(ext);
            if (type != null) {
                db.put(type, id, getReqJson() );
            } else {
                InputStream is = this.getReqBodyStream();
                OutputStream os = db.putFile(path);
                try {
                    IOUtils.copy(is, os);
                    os.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
            this.setOK();
            return;
        }
        this.setStatus(Status.BAD_REQUEST, "Bad request body");
    }
    
//  protected boolean allowDataAccess() {
//  return reqUri.lastIndexOf('/') > 0;
//}
//    @Override
//    protected boolean allowDataAccess() {
//        return this.isOwner() || super.allowDataAccess();
//    }

//    @Override
//    protected ObjectNode login(String username, ObjectNode input) {
////      // link the generated account
////      Sync.INSTANCE.addOnline((ObjectNode) output.get("login"));
//        return super.login(username, input);
//    }
//    @Override
//    protected boolean loginCheck(String username, String passkey) {
//        // for App, always accept login
//        return isSameDomain();
//    }
    
//    @Override
//    protected ObjectNode poll(ObjectNode input) {
//        ObjectNode output = super.poll(input);
//
////        // has token? -> join the tree
////        String token = this.sessionGetString("token");
////        if (token != null) {
////            this.sessionRemove("token");;
////            String treePath = "trees/"+token+".tree";
////            ObjectNode tree = Util.parseJson( db.get(treePath) );
////            if (tree != null) {
////                ObjectNode acct = JSON.createObjectNode();
////                ObjectNode acctTrees = acct.with("trees");
////                acctTrees.with(treePath).put("time", System.currentTimeMillis());
////                this.addTrees(acct);
////            }
////        }
//        
//        // OUT: network
////        if (this.isOwner() && this.activity != null) {
////            output.put("network", this.activity.getNetworkHelper().getJsonObject());
////        }
//        
//        // OUT: near
//        //output.put("clients", Sync.INSTANCE.getOnlines());
//        //output.put("servers", Sync.INSTANCE.getServersClients());
//        //output.put("sessionId", sessionGetId());
//        
//        return output;
//    }
    
//    @Override
//    protected String genGuestUsername() {
//        if (isOwner()) {
//            return "owner";
//        } else {
//            return super.genGuestUsername();
//        }
//    }
//    protected int minDigit = 2;
    
//    protected ObjectNode generateAccount() {
//        ObjectNode account = super.generateAccount();
//        // for identify the account even when server IP is changed
//        account.put("uuid", UUID.randomUUID().toString());
//        return account;
//    }
    
    private boolean matchToken() {
        String token = reqUri.substring(1);
        if (token == null || token.isEmpty())
            return false;
        String treeId = tokenToTree.get(token);
        if (treeId == null)
            return false;
        
//        if (reqHeaders.get("x-requested-with") != null) {
//            ObjectNode ret = JSON.createObjectNode();
//            ret.put("token", token);
//            ret.put("tree", tree);
//            // TODO: tree may not in root dir
//            this.setOK();
//            this.resBodyString = ret.toString();
//            return true;
//        }
            
//        String user = getOrCreateUser();
//        String treePath = "trees/"+treeId+".tree";
//        ObjectNode tree = Util.parseJson( db.get(treePath) );
//        if (tree != null) {
//            this.userAddTreePath(user, treePath);
//        }
        
        // redirect
        this.setStatus(Status.REDIRECT);
        this.resMime = "text/html; charset=UTF-8";
        this.reqHeaders.put("Location", "/#"+treeId);
        this.resBodyString = "<html><script>location='/#"+treeId+"'</script></html>";
//        this.setOK();
//        this.resBodyString = "<html><body>Token "+user+" + "+treeId+" -- "+ tree.toString() +"</body></html>";
        return true;
    }

    // Should moved to memcache?
    private static Map<String, String> treeToToken = new HashMap<String, String>(); 
    private static Map<String, String> tokenToTree = new HashMap<String, String>(); 
    
    protected ObjectNode token(ObjectNode input) {
        if (!this.isSameDomain())
            return null;
        String action = input.path("action").textValue();
        String tree = input.path("tree").textValue();
        if (action == null || action.isEmpty() || tree == null || tree.isEmpty())
            return null;
        ObjectNode output = JSON.createObjectNode();
        
        if (action.equals("switch")) {
        //if (action.equals("switch") && this.isAppClient()) {
            boolean on = input.path("value").asBoolean();
            String oldToken = treeToToken.get(tree);
            // clean
            if (oldToken != null) {
                treeToToken.remove(tree);
                tokenToTree.remove(oldToken);
            }
            if (on) {
                // create
                String newToken = null;
                Random random = new Random();
                while (newToken == null || tokenToTree.containsKey(newToken)) {
                    newToken = String.format(Locale.getDefault(), "%03d", random.nextInt(1000));
                }
                // set
                treeToToken.put(tree, newToken);
                tokenToTree.put(newToken, tree);
            }
            //onToken(on);
        }
        
        output.put("token", treeToToken.get(tree) );
        output.put("accessUrl", this.getAccessUrl() );
        if (this.activity != null) {
            ObjectNode network = this.activity.getNetworkHelper().getJsonObject();
            output.putAll(network);
        }
        
        //output.put("isAdmin", this.isAppClient());
        output.put("isAdmin", true);
        return output;
    }

    @Override
    protected ObjectNode getAccountTreeIds() {
        if (this.isOwner()) {
            ObjectNode ret = JSON.createObjectNode();
            Set<String> treeIds = FileDB.db.listTreeIds();
            for (String treeId : treeIds) {
                ret.put(treeId, true);
            }
            return ret;
        }
        return super.getAccountTreeIds();
    }
    
    protected boolean isOwner() {
        return false;
    }

    @Override
    protected String getAccessDomain() {
        return Httpd.getHost();
    }
//    @Override
//    protected String getFriendlyDomain() {
//        String manufacturer = Build.MANUFACTURER;
//        String model = Build.MODEL;
//        if (model.startsWith(manufacturer)) {
//            return Util.capitalize(model);
//        } else {
//            
//            return Util.capitalize(manufacturer)+model;
//        }
//    }
    
    private Map<String, Object> _session = null;
    protected abstract Map<String, Object> getOrCreateReqSession();
    private Map<String, Object> getReqSession() {
        if (_session != null)
            return _session;
        return _session = this.getOrCreateReqSession();
    }
    protected Object sessionGet(String name) {
        return this.getReqSession().get(name);
    }
    protected void sessionRemove(String name) {
        this.getReqSession().remove(name);
    }

    protected void sessionSet(String name, Object value) {
        this.getReqSession().put(name, value);
    }
    @Override
    protected String sessionGetId() {
        return (String) this.getReqSession().get("_id");
    }
    @Override
    protected void sessionKill() {
        Sessions.INSTANCE.kill(sessionGetId());
        _session = null;
    }
    
    @Override
    protected InputStream getAsset(String path) {
        try {
            path = path.replaceAll("/$", "");
            path = path.charAt(0) == '/' ? "www" + path : "www/" + path;
            return this.assetManager.open(path);
        } catch (IOException e) {
        }
        return null;
    }
}
