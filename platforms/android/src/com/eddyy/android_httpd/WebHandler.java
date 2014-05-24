package com.eddyy.android_httpd;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.util.Map;
import java.util.UUID;

import org.apache.commons.io.FileUtils;

import com.eddyy.common.Util;
import com.pithway.doc.PithwayAppActivity;

import fi.iki.elonen.NanoHTTPD.IHTTPSession;

public class WebHandler extends AppHandler {

    protected File packageFile;
    protected IHTTPSession http;

    public void init(PithwayAppActivity activity, IHTTPSession http){
        super.init(activity);
        if (activity != null) {
            this.packageFile = activity.packageFile;
        }
        this.http = http;
    }

    @Override
    protected String readAccountIds(){
        return http.getCookies().read("u");
    }
    @Override
    protected void writeAccountIds(String user){
        // expires How many days until the cookie expires.
        http.getCookies().set("u", user, 100);
        getOrCreateReqSession();
    }
    
    @Override
    protected Map<String, Object> getOrCreateReqSession() {
        String sessionId = http.getCookies().read("s");
        Map<String, Object> session = null;
        if (sessionId != null && !sessionId.isEmpty())
            session = Sessions.INSTANCE.getAndTouch(sessionId);
        if (session == null) {
            // regenerate
            sessionId = UUID.randomUUID().toString();
            session = Sessions.INSTANCE.generate(sessionId);
            http.getCookies().set("s", sessionId, 100);
        }
        return session;
    }

    @Override
    protected boolean route() {
        InputStream is = this.getAsset(this.reqUri);
        if (is != null) {
            // static file
            this.handleStream(is, getAssetLastModified(this.reqUri), getAssetLength(this.reqUri));
            return true;
        }
        return super.route();
    }
    
//    protected Map<String, Long> getJoinedTreePaths() {
//        if (this.isOwner())
//            return FileDB.db.getTreeMtimes();
//        Map<String, Long> ret = super.getJoinedTreePaths();
//        // join the cookie Tree
//        String treeStr = http.getCookies().read("T");
//        String[] treeIds = treeStr.split(",");
//        for (String treeId : treeIds) {
//            String treePath = "trees/"+treeId+".tree";
//            long mtime = FileDB.db.getMtime(treePath);
//            ret.put(treePath, mtime);
//        }
//        return ret;
//    }

    @Override
    protected String getReqBody() {
        if (!"PUT".equals(reqMethod))
            return null;
        try {
            String content = this.reqFiles.get("content");
            if (content != null && !content.isEmpty())
                return FileUtils.readFileToString( new File(content), Charset.forName("UTF-8") );
            else
                return null;
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }
    @Override
    protected InputStream getReqBodyStream() {
        if (!"PUT".equals(reqMethod))
            return null;
        try {
            return new FileInputStream(new File(this.reqFiles.get("content")));
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }
    

    /**
     * Serves static file
     */
    private void handleStream(InputStream is, long lastModified, long fileLen) {
        this.resMime = Util.getMime(reqUri);
        //        this.resStatus = 200;
        //        this.resBodyStream = is;

        try {
            // Support (simple) skipping:
            long startFrom = 0;
            long endAt = -1;
            String range = reqHeaders.get("range");
            if (range != null) {
                if (range.startsWith("bytes=")) {
                    range = range.substring("bytes=".length());
                    int minus = range.indexOf('-');
                    try {
                        if (minus > 0) {
                            startFrom = Long.parseLong(range.substring(0, minus));
                            endAt = Long.parseLong(range.substring(minus + 1));
                        }
                    } catch (NumberFormatException ignored) {
                    }
                }
            }

            String etag = Integer.toHexString((this.reqUri + lastModified + "" + fileLen).hashCode());

            // Change return code and add Content-Range header when skipping is requested
            if (range != null && startFrom >= 0) {
                if (startFrom >= fileLen) {
                    // RANGE_NOT_SATISFIABLE
                    this.resStatus = 416;
                    resHeaders.put("Content-Range", "bytes 0-0/" + fileLen);
                    resHeaders.put("ETag", etag);
                } else {
                    if (endAt < 0) {
                        endAt = fileLen - 1;
                    }
                    long newLen = endAt - startFrom + 1;
                    if (newLen < 0) {
                        newLen = 0;
                    }

                    final long dataLen = newLen;
                    BufferedInputStream fis = new BufferedInputStream(is) {
                        @Override
                        public int available() throws IOException {
                            return (int) dataLen;
                        }
                    };
                    fis.skip(startFrom);

                    // PARTIAL_CONTENT
                    this.resStatus = 206;
                    this.resBodyStream = fis;
                    resHeaders.put("Content-Length", "" + dataLen);
                    resHeaders.put("Content-Range", "bytes " + startFrom + "-" + endAt + "/" + fileLen);
                    resHeaders.put("ETag", etag);
                }
            } else {
                if (etag.equals(reqHeaders.get("if-none-match"))) {
                    // NOT_MODIFIED
                    this.resStatus = 304;
                    this.resBodyString = "";
                } else {
                    // OK
                    this.resStatus = 200;
                    this.resBodyStream = is;
                    // inner send(OutputStream outputStream) function will do this
                    //resHeaders.put("Content-Length", "" + fileLen);
                    resHeaders.put("ETag", etag);
                }
            }
        } catch (IOException ioe) {
            this.setStatus(Status.FORBIDDEN, "FORBIDDEN: Reading file failed.");
        }

        resHeaders.put("Accept-Ranges", "bytes"); // Announce that the file server accepts partial content requests
    }

    public long getAssetLength(String path){
        try {
            path = ("www/" + path).replaceAll("/+", "/").replaceAll("/*$", "");
            return this.assetManager.openFd(path).getLength();
        } catch (IOException e) {
        }
        return 0;
    }

    public long getAssetLastModified(String path){
        return this.packageFile.lastModified(); //Epoch Time
    }
}
