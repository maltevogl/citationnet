import os

from flask import Flask, render_template
mainpath = os.path.dirname(os.path.abspath(__file__))

def create_app(test_config=None):
    # create and configure the app
    app = Flask(
        "citationnet",
        # instance_relative_config=True,
        template_folder=f'{mainpath}/templates',
        static_url_path="/static",
        static_folder='static',
        root_path=mainpath
    )
    # app.config.from_mapping(
    #     SECRET_KEY='dev',
    #     DATABASE=os.path.join(app.instance_path, 'citationnet.sqlite'),
    # )

    if test_config is None:
        # load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)

    # ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # a simple page that says hello
    @app.route('/')
    def hello():
        return 'Startpage!'

    @app.route('/citationnet/')
    @app.route('/citationnet/<name>')
    def citnet(name=None, jsonDataPath=f'{mainpath}/media/data/'):
        return render_template('visDynamic.html', name=name, datafolder=jsonDataPath)
    return app