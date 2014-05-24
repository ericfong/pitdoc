/** @jsx React.DOM */

var AboutPage = React.createClass({
    mixins: [MyMixin],
    
    render: function() {
        var title = 'Pithway';
        if (typeof document != 'undefined')
            document.title = title;
        return (
        <div>
            <TreeNavBar></TreeNavBar>
            <div className="container text-center">

            <p style={{height:'20px'}}></p>
                <div className="inner cover">
                    <h1 className="cover-heading"><span>The Doc that Merge!</span></h1>
                    <p className="lead">Version conflicts can merge itself.</p>
                  </div>
                  
                  <p style={{height:'20px'}}></p>
                  
              <div style={{padding:'0 15px'}}>
              <div className="row">
                <div className="col-sm-4" style={{marginBottom:'80px'}}>
                  <h1 style={{height:'120px'}}><span className="glyphicon glyphicon-import" style={{fontSize:'200%'}}></span></h1>
                  <p style={{fontSize:'200%'}}>Down &amp; Edit</p>
                  <p>Download and edit in your own device or browser. Free from the dependency of servers.</p>
                </div>
                
                <div className="col-sm-4" style={{marginBottom:'80px'}} >
                  <h1 style={{height:'120px'}}><span className="glyphicon glyphicon-export" style={{fontSize:'200%'}}></span></h1>
                  <p style={{fontSize:'200%'}}>Upload</p>
                  <p>Upload when you feel ready. Typos won't be shown to your Boss.</p>
                </div>
                
                <div className="col-sm-4" style={{marginBottom:'80px'}}>
                  <h1 style={{height:'120px'}}><span className="fa fa-code-fork" style={{fontSize:'200%'}}></span></h1>
                  <p style={{fontSize:'200%'}}>Merge</p>
                  <p>Auto merge the version conflicts between you and your teammates.</p>
                </div>
              </div>            
              </div>
            </div>
        </div>
        )
    },
    
});
