package com.eddyy.common;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.Charset;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.Map.Entry;

import org.apache.commons.io.IOUtils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

public class Util {
    
    public static ObjectMapper JSON = new ObjectMapper();
    private static final Charset UTF8_CHARSET = Charset.forName("UTF-8");
    
    public static String inputStreamToString(final InputStream is) {
        try {
            return IOUtils.toString(is, UTF8_CHARSET);
        } catch (IOException e) {
        }
        return null;
    }
    
    public static String normalizePath(String uri) {
        // normalize path
        uri = uri.replaceAll("/+", "/");
        try {
            uri = new URI(uri).normalize().getPath();
        } catch (URISyntaxException e) {
        }
        if (uri.endsWith("/"))
            uri += "index.html";
        return uri;
    }

    public static JsonNode parseJson(String json) {
        if (json == null || json.isEmpty())
            return null;
        JsonNode obj = null;
        try {
            obj = JSON.readTree(json);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return obj;
    }
    public static ObjectNode parseObject(String json) {
        return (ObjectNode) parseJson(json);
    }
    public static ArrayNode parseArray(String json) {
        return (ArrayNode) parseJson(json);
    }
    
    public static Set<String> getTreeRes(ObjectNode tree) {
        Set<String> ret = new HashSet<String>();
//        String dir = treePath.substring(0, treePath.lastIndexOf('/') + 1);
        Iterator<Entry<String, JsonNode>> iter = tree.with("nodes").fields();
        while (iter.hasNext()) {
            Entry<String, JsonNode> entry = iter.next();
//            String nodeId = entry.getKey();
            JsonNode node = entry.getValue();
            String resPath = node.path("resPath").textValue();
            if (resPath != null)
                ret.add(resPath);
        }
        return ret;
    }

    public static String capitalize(String s) {
        if (s == null || s.length() == 0) {
            return "";
        }
        char first = s.charAt(0);
        if (Character.isUpperCase(first)) {
            return s;
        } else {
            return Character.toUpperCase(first) + s.substring(1);
        }
    }
    
    // public Path getUniqueStemId(Path p) {
    // while (this.has(p.toString())) {
    // char c1 = base32.charAt( rnd.nextInt(base32.length()) );
    // char c2 = base32.charAt( rnd.nextInt(base32.length()) );
    // p.dir += c1+""+c2;
    // }
    // return p;
    // }
    // static String base32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
    // static Random rnd = new Random();

    
    public static String stringJoin(Collection<String> s, String glue) {
    	int k = s.size();
    	if (k == 0)
    		return "";
    	StringBuilder out = new StringBuilder();
    	Iterator<String> it = s.iterator();
        if(it.hasNext()) {
        	out.append(it.next());
        }
        while(it.hasNext()) {
        	out.append(glue).append(it.next());
        }
    	return out.toString();
    }
    
    
    /**
     * Common mime for dynamic content: binary
     */
    private static final String MIME_DEFAULT_BINARY = "application/octet-stream";
    /**
     * Hashtable mapping (String)FILENAME_EXTENSION -> (String)MIME_TYPE
     */
    @SuppressWarnings("serial")
    private static final Map<String, String> MIME_TYPES = new HashMap<String, String>() {{
        put("css", "text/css");
        put("htm", "text/html");
        put("html", "text/html");
        put("xml", "text/xml");
        put("java", "text/x-java-source, text/java");
        put("txt", "text/plain");
        put("asc", "text/plain");
        put("gif", "image/gif");
        put("jpg", "image/jpeg");
        put("jpeg", "image/jpeg");
        put("png", "image/png");
        put("mp3", "audio/mpeg");
        put("m3u", "audio/mpeg-url");
        put("mp4", "video/mp4");
        put("ogv", "video/ogg");
        put("flv", "video/x-flv");
        put("mov", "video/quicktime");
        put("swf", "application/x-shockwave-flash");
        put("js", "application/javascript");
        put("pdf", "application/pdf");
        put("doc", "application/msword");
        put("ogg", "application/x-ogg");
        put("zip", "application/octet-stream");
        put("exe", "application/octet-stream");
        put("class", "application/octet-stream");

        put("appcache", "application/json");
        put("json", "application/font-woff");
        put("woff", "application/font-woff");
        put("ico", "image/x-icon");
    }};
    public static String getMime(String filename) {
        String mime = null;
        // Get MIME from file name extension, if possible
        int dot = filename.lastIndexOf('.');
        if (dot >= 0) {
            mime = MIME_TYPES.get(filename.substring(dot + 1).toLowerCase(Locale.US));
        }
        if (mime == null) {
            mime = MIME_DEFAULT_BINARY;
        }
        return mime;
    }
    
    
//    public class Path {
//        public String dir = "";
//        public String ext = "json";
//        public String name = "index";
//
//        public Path(String path) {
//            List<String> oParts = Arrays.asList(path.split("/+"));
//            List<String> parts = new ArrayList<String>();
//            for (String part : oParts) {
//                if (!part.isEmpty())
//                    parts.add(part);
//            }
//
//            // ext and basename
//            String basename = parts.remove(parts.size() - 1);
//            int extI = basename.lastIndexOf('.');
//            if (extI >= 0) {
//                String ext = basename.substring(extI + 1);
//                if (!ext.isEmpty())
//                    this.ext = ext.toLowerCase(Locale.US);
//                basename = basename.substring(0, extI);
//            }
//            if (!basename.isEmpty())
//                this.name = basename;
//
//            String dir = stringJoin(parts, "/");
//            if (!dir.isEmpty())
//                this.dir = dir;
//        }
//
//        public String fullname() {
//            return dir.isEmpty() ? name : dir + "/" + name;
//        }
//
//        public String toString() {
//            return dir.isEmpty() ? name + "." + ext : dir + "/" + name + "." + ext;
//        }
//    }
    /*

    public void appcacheWalk(Set<String> paths, String dir, String id) {
        String itsPath = dir + id + ".commit";
        if (paths.contains(itsPath))
            return;

        String json = this.db.get(itsPath);
        if (json == null)
            return;
        ObjectNode commit = Utils.parseJson(json);
        if (commit == null)
            return;

        // itself
        paths.add(itsPath);

        // befores
        Iterator<JsonNode> froms = commit.withArray("befores").iterator();
        while (froms.hasNext()) {
            appcacheWalk(paths, dir, froms.next().asText());
        }
        // pack
        Iterator<JsonNode> pack = commit.withArray("pack").iterator();
        while (pack.hasNext()) {
            String path = dir + pack.next().asText() + ".node";
            paths.add(path);
        }
    }


     */
}
