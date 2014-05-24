package com.eddyy.common;

import java.io.InputStream;
import java.nio.charset.Charset;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import org.apache.commons.io.IOUtils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

public abstract class HandlerAPI {
    protected ObjectMapper JSON = new ObjectMapper();
    
    protected DB db;

    protected String reqMethod;
    protected String reqUri;
    protected Map<String, String> reqParams;
    protected Map<String, String> reqHeaders;
    protected Map<String, String> reqFiles;
    protected int resStatus = 404;
    protected String resMime = "text/plain; charset=UTF-8";
    protected Map<String, String> resHeaders = new HashMap<String, String>();
    protected String resBodyString;
    protected InputStream resBodyStream;

    protected abstract InputStream getAsset(String path);
    protected abstract String getReqBody();
    protected abstract InputStream getReqBodyStream();

    protected abstract Object sessionGet(String name);
    protected abstract void sessionRemove(String name);
    protected abstract void sessionSet(String name, Object value);
    protected abstract String sessionGetId();
    protected abstract void sessionKill();

    public void handle(String reqMethod, String reqUri, Map<String, String> reqParams, Map<String, String> reqHeaders, Map<String, String> reqFiles) {
        this.reqMethod = reqMethod;
        this.reqUri = Util.normalizePath(reqUri);
        // System.out.println(this.reqMethod+" "+this.reqUri);
        this.reqParams = reqParams;
        this.reqHeaders = reqHeaders;
        this.reqFiles = reqFiles;

        try {
            if (!this.preRoute()) {
                this.route();
            }
        } catch(Exception e) {
            e.printStackTrace();
            this.setStatus(Status.INTERNAL_ERROR, "Opps! Internal Error...");
        }
        this.postHandle();
    }
	protected boolean preRoute() {
        if (reqMethod.equals("OPTIONS")) {
            this.setOK();
            return true;
        }
        return false;
    }
    protected abstract boolean route();
    protected void postHandle() {
        String origin = reqHeaders.get("origin");
        if (origin != null) {
            //resHeaders.put("Access-Control-Allow-Origin", "*");
            resHeaders.put("Access-Control-Allow-Origin", origin);
            
            String accessMethod = reqHeaders.get("access-control-request-method");
            if (accessMethod != null)
                resHeaders.put("Access-Control-Allow-Methods", accessMethod);
            
            String accessHeaders = reqHeaders.get("access-control-request-headers");
            if (accessHeaders != null)
                resHeaders.put("Access-Control-Allow-Headers", accessHeaders);

            resHeaders.put("Access-Control-Allow-Credentials", "true");
        }
        
        if (accountIds != null) {
        	writeAccountIds( Util.stringJoin(accountIds, ",") );
        }
    }

    private Set<String> accountIds = null;
    protected Set<String> getAccountIds() {
        if (accountIds == null) {
            accountIds = new HashSet<String>();
            String accountStr = readAccountIds();
            if (accountStr != null && !accountStr.isEmpty()) {
                accountIds.addAll(Arrays.asList( accountStr.split(",") ));
            }
        }
        return accountIds;
    }
    protected abstract String readAccountIds();
    protected abstract void writeAccountIds(String user);
    
    
//    protected void handlePutStream() {
//        InputStream content = this.getReqBodyStream();
//        if (content != null) {
//            try {
//                IOUtils.copy( content, db.putStream(this.reqUri) );
//            } catch (IOException e) {
//                e.printStackTrace();
//            }
//            this.setOK();
//        } else {
//            this.setError(404, "Bad request body stream");
//        }
//    }
    
    protected boolean isSameDomain(){
        String host = this.reqHeaders.get("host");
        String origin = reqHeaders.get("origin");
        //String referer = this.reqHeaders.get("referer");
        //return host == null || referer == null || referer.isEmpty() || referer.contains(host);
        return host == null || origin == null || origin.isEmpty() || origin.contains(host);
    }
    protected String sessionGetString(String name) {
        return (String) sessionGet(name);
    }
    
    
//    protected ObjectNode getAccountObject(String username) {
//        ObjectNode account = JSON.createObjectNode();
//        
//        String id = null;
//        String url = null;
////        String name = null;
//        if (username != null && !username.isEmpty()) {
//            id = username + "@" + getUniqueDomain();
//            url = getAccessUrl()+"/@"+username;
////            name = getUserFriendlyName(username) + "@" + getFriendlyDomain();
//        }
//        
//        account.put("url", url);
//        account.put("id", id);
////        account.put("name", name);
//        account.put("user", username);
//        return account;
//    }
//    protected String getValidUsername(String username) {
//        username = username.toLowerCase();
//        username = username.replaceAll("[^-a-zA-Z0-9]+", "-").replaceAll("^-+", "").replaceAll("-+$", "");
//        // check avaliable?
//        return username;
//    }

    
    
    
//    // for human read
//    protected String getFriendlyDomain() {
//        return reqHeaders.get("host");
//    }
    // for url and browser
    protected String getAccessDomain() {
        return reqHeaders.get("host");
    }
//    // for find the device when it changed ip;  should be equal to accessDomain in this stage
//    protected String getUniqueDomain() {
//        return getAccessDomain();
//    }
    protected String getAccessUrl() {
        return "http://"+getAccessDomain();
    }

//    private static Random RANDOM = new Random();
//    protected int minDigit = 4;
//    protected String genGuestUsername() {
//        for (int d = minDigit; d <= 10; d++) {
//            int number = RANDOM.nextInt( (int)Math.pow(10, d) );
//            String username = "guest"+number;
//            //String username = "guest"+String.format(Locale.US, "%0"+d+"d", number );
//            if (!db.has(username+".user")) {
//                return username;
//            }
//        }
//        return null;
//    }
    
    
    
    
    
    
    protected void setStatus(Status status, String msg, String mime) {
        this.resStatus = status.getCode();
        this.resMime = mime;
        this.resBodyString = msg;
    }
    protected void setStatus(Status status, String msg) {
        setStatus(status, msg, "text/plain; charset=UTF-8");
    }
    protected void setStatus(Status status) {
        setStatus(status, status.getDescription());
    }
    
    protected void setOK(String msg, String mime) {
        setStatus(Status.OK, msg, mime);
    }
    protected void setOK(String msg) {
        setOK(msg, "text/plain; charset=UTF-8");
    }
    protected void setOK() {
        setOK("OK");
    }

    
//    protected void setError(int resStatus, String msg) {
//        this.resStatus = resStatus;
//        this.resMime = "text/plain; charset=UTF-8";
//        this.resBodyString = msg;
//    }
//    protected ObjectNode setStatus(Status status) {
//        this.resStatus = status.getCode();
//        this.resMime = "text/plain; charset=UTF-8";
//        this.resBodyString = status.getDescription();
//        return null;
//    }
//    protected ObjectNode setStatus(Status status, String msg) {
//        this.setStatus(status);
//        this.resBodyString = msg;
//        return null;
//    }
    
    public enum Status {
        OK(200, "OK"), CREATED(201, "Created"), ACCEPTED(202, "Accepted"), NO_CONTENT(204, "No Content"), PARTIAL_CONTENT(206, "Partial Content"), REDIRECT(301,
            "Moved Permanently"), NOT_MODIFIED(304, "Not Modified"), BAD_REQUEST(400, "Bad Request"), UNAUTHORIZED(401,
            "Unauthorized"), FORBIDDEN(403, "Forbidden"), NOT_FOUND(404, "Not Found"), METHOD_NOT_ALLOWED(405, "Method Not Allowed"), RANGE_NOT_SATISFIABLE(416,
            "Requested Range Not Satisfiable"), INTERNAL_ERROR(500, "Internal Server Error");
        private final int code;
        private final String description;

        Status(int code, String description) {
            this.code = code;
            this.description = description;
        }

        public int getCode() {
            return this.code;
        }

        public String getDescription() {
            return "" + this.code + " " + description;
        }
    }    
    
    protected ObjectNode getReqJson() {
        return Util.parseObject(this.getReqBody());
    }
    protected boolean setResJson(JsonNode output) {
        if (output != null)
            this.setOK(output.toString(), "application/json; charset=UTF-8");
        return true;
    }
    protected boolean setResString(String output) {
        if (output != null) {
            this.setOK();
            this.resBodyString = output;
        }
        return true;
    }
    
    public String getResBody() {
        if (this.resBodyString != null)
            return this.resBodyString;
        else if (this.resBodyStream != null)
            return Util.inputStreamToString(this.resBodyStream); 
        else
            return 200 <= resStatus && resStatus < 400 ? "OK" : "NotFound";
    }
    private static final Charset UTF8_CHARSET = Charset.forName("UTF-8");
    public InputStream getResBodyStream() {
        if (this.resBodyString != null)
            return IOUtils.toInputStream(this.resBodyString, UTF8_CHARSET);
        else if (this.resBodyStream != null)
            return this.resBodyStream;
        else
            return IOUtils.toInputStream(200 <= resStatus && resStatus < 400 ? "OK" : "NotFound", UTF8_CHARSET);
    }
    public Map<String, String> getResHeaders() {
        return this.resHeaders;
    }
    public String getResMime() {
        return this.resMime;
    }
    public int getResStatus() {
        return this.resStatus;
    }
}
