package com.eddyy.android_httpd;

import java.io.InputStream;
import java.nio.charset.Charset;
import java.util.Map;

import org.apache.commons.io.IOUtils;

import com.eddyy.common.Util;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.pithway.doc.PithwayAppActivity;

public class CordovaHandler extends AppHandler {

    private static final Charset UTF8_CHARSET = Charset.forName("UTF-8");
    
    public void init(PithwayAppActivity activity) {
        super.init(activity);
    }

    @Override
    public boolean route() {
        
        if (this.reqUri.equals("/setWifiStation")) {
            ObjectNode input = Util.parseObject(this.getReqBody());
            activity.getNetworkHelper().setStationEnabled( input.get("enable").asBoolean() );
            return true;
        }
        
        return super.route();
    }
    
    @Override
    protected boolean isOwner(){
        return true;
    }
    
    @Override
    protected String readAccountIds(){
        return sessionGetString("accountIds");
    }
    @Override
    protected void writeAccountIds(String accountIds){
        sessionSet("accountIds", accountIds);
    }
    
    @Override
    protected Map<String, Object> getOrCreateReqSession() {
        return Sessions.INSTANCE.getAndTouch(Sessions.INSTANCE.OWNER_SESSION_ID);
    }
    
    @Override
    protected String getReqBody() {
        if (!"PUT".equals(reqMethod))
            return null;
        return this.reqParams.get("content");
    }
    @Override
    protected InputStream getReqBodyStream() {
        if (!"PUT".equals(reqMethod))
            return null;
        return IOUtils.toInputStream( this.reqParams.get("content"), UTF8_CHARSET );
    }
}
