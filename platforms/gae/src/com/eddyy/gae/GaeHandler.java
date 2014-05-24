package com.eddyy.gae;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.util.Set;

import javax.servlet.ServletContext;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.IOUtils;

import com.eddyy.common.*;
import com.fasterxml.jackson.databind.node.ObjectNode;

public class GaeHandler extends Handler {
    
    private static final Charset UTF8_CHARSET = Charset.forName("UTF-8");
    
    private ServletContext servletContext;
    private HttpServletRequest servletReq;
    private HttpServletResponse servletRes;
    
    public GaeHandler(ServletContext servletContext, HttpServletRequest req, HttpServletResponse res) {
        this.servletContext = servletContext;
        this.servletReq = req;
        this.servletRes = res;
        this.db = new GaeDB();
    }

    @Override
    protected boolean route() {
        if (reqUri.startsWith("/setAccountPass")) {
            return setResString( this.setAccountPass( getReqJson() ) );
        }
        
        if (reqUri.equals("/draft")) {
            return setResString( this.draft( getReqJson() ) );
        }
        if (reqUri.startsWith("/draft/")) {
            String path = reqUri.substring("/draft/".length());
            return setResString( this.getDraft(path) );
        }
        
        return super.route();
    }

    private String draft(ObjectNode reqJson) {
        if (reqJson == null) return null;
        String treeId = reqJson.path("treeId").textValue();
        String accountId = reqJson.path("accountId").textValue();
        String draft = reqJson.path("draft").textValue();
        if (treeId == null || accountId == null || draft == null) {
            setStatus(Status.BAD_REQUEST, "treeId or accountId or draft is null");
            return null;
        }
        
        Set<String> accountIds = getAccountIds();
        if (!accountIds.contains(accountId)) {
            setStatus(Status.UNAUTHORIZED, "accountId is not loged in");
            return null;
        }
        
        db.put(Type.draft, treeId+"__"+accountId, draft);
            
        return "OK";
    }

    private String getDraft(String path) {
        int index = path.indexOf("__");
        if (index <= 0)
            return null;
        String treeId = path.substring(0, index);
        String accountId = path.substring(index+2);
        if (treeId == null || accountId == null) {
            setStatus(Status.BAD_REQUEST, "treeId or accountId is null");
            return null;
        }
        
        Set<String> accountIds = getAccountIds();
        if (!accountIds.contains(accountId)) {
            setStatus(Status.UNAUTHORIZED, "accountId is not loged in");
            return null;            
        }
            
        return db.get(Type.draft, path);
    }
    
    @Override
    protected void onPoll(ObjectNode oTree, String treeId) {
//        ObjectNode drafts = oTree.with("drafts");
//        for (String accountId : getAccountIds()) {
//            drafts.put(accountId, db.get(Type.draft, treeId+"__"+accountId));
//        }
    }
    
    @Override
    protected String readAccountIds(){
        Cookie[] cookies = servletReq.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("u".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
    @Override
    protected void writeAccountIds(String user){
        Cookie cookie = new Cookie("u", user);
        // maximum age of the cookie in seconds; if negative, means the cookie is not stored; if zero, deletes the cookie
        cookie.setMaxAge(100*24*3600);
        servletRes.addCookie(cookie);
    }
    
    // E.ajax('settingUserPasskey', {username:'eric', passkey:E.util.hash('eric001')}, function(r){console.log(r)})
    private String setAccountPass(ObjectNode input) {
        if (input == null) return null;

        String accountId = input.path("accountId").textValue();
        String passkeyOld = input.path("passkeyOld").textValue();
        String passkey = input.path("passkey").textValue();
        
        if (accountId == null || accountId.isEmpty())
            return "Account Id Is Empty";
        accountId = accountId.toLowerCase();
        
        String dbPasskey = db.get(Type.pass, accountId);
        if (dbPasskey != null && !dbPasskey.isEmpty() && !dbPasskey.equals(passkeyOld)) {
            return "Passkey Not Match";
        }
        
        if (passkey == null)
            passkey = "";
        db.put(Type.pass, accountId, passkey);
        return "OK";
    }

//    @Override
//    protected ObjectNode connectCheck(String accountId, String passkey) {
//        ObjectNode result = super.connectCheck(accountId, passkey);
//        
//        // warnings
//        if (passkey == null || passkey.isEmpty()) {
//            result.with("warnings").put("passkeyIsEmpty", true);
//        }
//        
//        return result;
//    }
    

    @Override
    protected String getAccessDomain() {
        return reqHeaders.get("host").replaceFirst("^www\\.", "");
    }
    @Override
    protected String getAccessUrl() {
        return (servletReq.isSecure() ? "https://" : "http://") + reqHeaders.get("host");
    }
    @Override
    protected String getReqBody() {
        try {
            return IOUtils.toString(servletReq.getInputStream(), UTF8_CHARSET);
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }
    @Override
    protected InputStream getReqBodyStream() {
        try {
            return servletReq.getInputStream();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }
	@Override
	public InputStream getAsset(String path) {
        return this.servletContext.getResourceAsStream("/WEB-INF/"+path);
	}
    @Override
    protected Object sessionGet(String name) {
        return servletReq.getSession().getAttribute(name);
    }
    @Override
    protected void sessionRemove(String name) {
        servletReq.getSession().removeAttribute(name);
    }
    @Override
    protected void sessionSet(String name, Object value) {
        servletReq.getSession().setAttribute(name, value);
    }
    @Override
    protected String sessionGetId() {
        return servletReq.getSession().getId();
    }
    @Override
    protected void sessionKill() {
        servletReq.getSession().invalidate();
    }
}
//private boolean basicAuthorization() {
//String auth = reqHeaders.get("authorization");
//if (auth == null || !auth.toUpperCase().startsWith("BASIC "))
//  return false;
//// Get encoded user and password, comes after "BASIC "  
//String userpassEncoded = auth.substring(6);  
//// Decode it, using any base 64 decoder  
//String userpassDecoded = new String(DatatypeConverter.parseBase64Binary(userpassEncoded));
//int i = userpassDecoded.indexOf(':');
//if (i >= 0) {
//  String username = userpassDecoded.substring(0, i).trim();
//  String password = userpassDecoded.substring(i+1).trim();
//  
//  // FIXME: 
//  // Check our user list to see if that user and password are "allowed"  
//  if (username.equals(password)) {
//      sessionSet("account", username);
//      return true;
//  }
//}
//return false;
//}
