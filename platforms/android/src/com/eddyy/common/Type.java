package com.eddyy.common;

public enum Type {
    node, commit, 
    master, members, rights,
    inbox, pass, draft;
    
    public static Type lookup(String id) {
        for (Type t: values()){
            if (t.toString().equalsIgnoreCase(id)) 
                return t;
        }
        return null;
    }    
}