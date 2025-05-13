import os
import json
import sys
from dotenv import load_dotenv
from wand.image import Image as WandImage
from wand.drawing import Drawing
from wand.color import Color
from moviepy.editor import ImageClip, AudioFileClip, concatenate_videoclips, CompositeVideoClip, vfx, ColorClip
import azure.cognitiveservices.speech as speechsdk
from pygments import highlight
from pygments.lexers import PythonLexer, JavaLexer, MathematicaLexer, CppLexer, CSharpLexer, HtmlLexer, CssLexer, JavascriptLexer, JsonLexer, YamlLexer, BashLexer, PerlLexer, PhpLexer, RubyLexer, SqlLexer, SwiftLexer, ObjectiveCLexer, MatlabLexer
from pygments.formatters import ImageFormatter
import subprocess
from moviepy.video.fx.fadein import fadein
from moviepy.video.fx.fadeout import fadeout
from google import genai
from google.genai import types 
import re
import base64 
import asyncio
import matplotlib.pyplot as plt
import logging 

# --- Configuration & Setup ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
load_dotenv() # Load environment variables from .env file

# --- Azure Speech Config ---
try:
    speech_key = 'BdTcoulyAq3osLOnFTyNVtb8UudaziGVF0gE5ZD9mKhBrUYxoGXaJQQJ99BEACGhslBXJ3w3AAAYACOGYZi5'
    speech_region ='centralindia'
    if not speech_key or not speech_region:
        raise ValueError("SPEECH_KEY and SPEECH_REGION environment variables must be set.")
    speech_config = speechsdk.SpeechConfig(subscription=speech_key, region=speech_region)
    # Configure voice - Use environment variables or defaults
    speech_config.speech_synthesis_language = os.getenv('SPEECH_LANGUAGE', "en-IN")
    speech_config.speech_synthesis_voice_name = os.getenv('SPEECH_VOICE', "en-IN-ArjunNeural")
    logging.info(f"Azure Speech configured for region: {speech_region}, language: {speech_config.speech_synthesis_language}, voice: {speech_config.speech_synthesis_voice_name}")
except Exception as e:
    logging.error(f"Failed to configure Azure Speech SDK: {e}")
    sys.exit(1) # Exit if speech config fails

# --- Constants ---
DEFAULT_TEMPLATE_PATH = "template3.json" # Default template file name
DEFAULT_BACKGROUND_IMAGE = "UnstopWatermark.png" # Default background image
DEFAULT_CHART_COLORS = plt.cm.viridis # Default color map

# --- Event Loop Handling ---
def get_or_create_eventloop():
    try:
        return asyncio.get_event_loop()
    except RuntimeError as ex:
        if "There is no current event loop in thread" in str(ex):
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            logging.info("Created new asyncio event loop.")
            return asyncio.get_event_loop()
    return asyncio.get_event_loop() # Return existing loop if available

# Ensure an event loop exists for the current thread (important for Azure SDK async calls)
try:
    loop = get_or_create_eventloop()
except Exception as e:
     logging.warning(f"Could not ensure event loop: {e}") # Log warning, might not be fatal

# --- Helper Functions ---

def sanitize_text(text):
    """Sanitize text by replacing curly quotes with standard ASCII characters."""
    if not isinstance(text, str):
        logging.warning(f"sanitize_text received non-string input: {type(text)}. Converting to string.")
        text = str(text)
    sanitized = text.replace("\u2019", "'").replace("\u201c", '"').replace("\u201d", '"')
    # Remove any potential SSML tags just in case
    sanitized = re.sub('<[^>]*>', '', sanitized)
    return sanitized

def slide_transition(clip1, clip2, direction, duration):
    w, h = clip1.size

    # Load the background image
    background = ImageClip("Unstop.png").set_duration(duration).resize((w, h))

    if direction == "top":
        clip1 = clip1.set_position(lambda t: ('center', -w * t / duration))
        clip2 = clip2.set_position(lambda t: ('center', w - w * t / duration))
    elif direction == "bottom":
        clip1 = clip1.set_position(lambda t: ('center', w * t / duration))
        clip2 = clip2.set_position(lambda t: ('center', -w + w * t / duration))
    elif direction == "left":
        clip1 = clip1.set_position(lambda t: (-h * t / duration, 'center'))
        clip2 = clip2.set_position(lambda t: (h - h * t / duration, 'center'))
    elif direction == "right":
        clip1 = clip1.set_position(lambda t: (h * t / duration, 'center'))
        clip2 = clip2.set_position(lambda t: (-h + h * t / duration, 'center'))

    # Create the transition clip with the background image
    transition = CompositeVideoClip([background, clip1, clip2.set_start(duration)]).set_duration(duration).without_audio()
    
    return concatenate_videoclips([clip1, transition, clip2.set_start(duration)])

def dissolve_transition(clip1, clip2, duration):
    clip1 = fadeout(clip1,duration)
    clip2 = fadein(clip2,duration)
    return concatenate_videoclips([clip1, clip2])

def apply_transition(clip1, clip2, transition_type="slide_left", duration=2):
    if transition_type == "slide_left":
        return slide_transition(clip1, clip2, direction="left", duration=duration)
    elif transition_type == "slide_right":
        return slide_transition(clip1, clip2, direction="right", duration=duration)
    elif transition_type == "slide_up":
        return slide_transition(clip1, clip2, direction="top", duration=duration)
    elif transition_type == "slide_down":
        return slide_transition(clip1, clip2, direction="bottom", duration=duration)
    elif transition_type == "fade_in":
        clip2 = fadein(clip2, duration)
        return concatenate_videoclips([clip1, clip2])
    elif transition_type == "fade_out":
        clip1 = fadeout(clip1, duration)
        return concatenate_videoclips([clip1, clip2])
    elif transition_type == "dissolve":
        return dissolve_transition(clip1, clip2, duration)
    return concatenate_videoclips([clip1, clip2])

def wrap_text(draw, text, max_width, font_size, line_spacing):
    """Wraps text dynamically and returns the wrapped lines along with the total height consumed."""
    lines = []
    words = text.split()
    current_line = ""
    total_height = 0

    for word in words:
        test_line = f"{current_line} {word}".strip()
        metrics = draw.get_font_metrics(WandImage(width=1, height=1), test_line)
        
        if metrics.text_width <= max_width:
            current_line = test_line
        else:
            lines.append(current_line)
            current_line = word
            total_height += line_spacing  # Increase height when new line is added

    if current_line:
        lines.append(current_line)
        total_height += line_spacing

    return lines, total_height

def generate_chart_image(slide_data, chart_path, template):
    """Generate a chart image with configurable styles."""
    chart_config = template.get("chart_slide", {}).get("chart_style", {})

    # Read styling properties from JSON
    show_legend = chart_config.get("show_legend", True)
    show_data_points = chart_config.get("show_data_points", True)
    figure_size = chart_config.get("figure_size", [10, 6])
    bar_color = chart_config.get("bar_color", "blue")
    line_color = chart_config.get("line_color", "b")
    pie_colors = chart_config.get("pie_colors", ["#FF5733", "#33FF57", "#3357FF"])
    background_color = chart_config.get("background_color", None)
    tick_color = chart_config.get("tick_color", "#000000")
    spine_color = chart_config.get("spine_color", "#000000")
    title_color = chart_config.get("title_color", "#000000")
    title_size = chart_config.get("title_size", 16)
    label_color = chart_config.get("label_color", "#000000")
    label_size = chart_config.get("label_size", 14)

    chart_type = slide_data.get("chartType", "bar")
    data = slide_data.get("data", [])
    title = slide_data.get("title", "Chart")
    labels = [item["label"] for item in data]
    values = [item["value"] for item in data]

    fig, ax = plt.subplots(figsize=figure_size)

    # Apply background color
    ax.set_facecolor(background_color)

    if chart_type == "bar":
        ax.bar(labels, values, color=bar_color)
        if show_data_points:
            for i, v in enumerate(values):
                ax.text(i, v, str(v), ha='center', fontsize=13, color=label_color)

    elif chart_type == "line":
        ax.plot(labels, values, marker='o', linestyle='-', color=line_color)
        if show_data_points:
            for i, v in enumerate(values):
                ax.text(i, v, str(v), ha='center', fontsize=16, color=label_color)

    elif chart_type == "pie":
        ax.pie(values, labels=labels, autopct='%1.1f%%' if show_data_points else None, 
               startangle=140, colors=pie_colors)

    # Apply title and labels styling
    ax.set_title(title, fontsize=title_size, color=title_color)
    ax.tick_params(colors=tick_color, labelsize=label_size)
    ax.spines['bottom'].set_color(spine_color)
    ax.spines['left'].set_color(spine_color)
    ax.yaxis.label.set_color(label_color)
    ax.xaxis.label.set_color(label_color)
    
    # Apply legend if required
    if show_legend and chart_type != "pie":
        ax.legend(labels, loc='best', fontsize=label_size)

    plt.savefig(chart_path, format="png", dpi=300, bbox_inches="tight")
    plt.close()

def generate_slide_image(slide_data, template, output_path):
    """
    Generate slide image using Wand instead of OpenCV.
    Reads the slide’s data and applies configurations from template.
    """
    slide_type = slide_data.get("type", "content_slide")
    config = template.get(slide_type, template.get("content_slide"))
    
    slide_size = [1920, 1080]
    width, height = slide_size
    with WandImage(filename='UnstopWatermark.png') as background:
        width, height = background.width, background.height
        y_offset = 0
        with WandImage(width=width, height=height, background=Color('transparent')) as img:
            img.composite(background, left=0, top=0)
            with Drawing() as draw:
                for key in ["title", "subtitle", "content", "question", "options", "points", "explanation"]:
                    if key in slide_data and key in config:
                        text_conf = config[key]
                        max_width = width - 200  # Allow margin
                        fontsize = text_conf.get("font_size", int(text_conf.get("scale", 1.0) * 30))
                        font = text_conf.get("font_path", None)
                        text_color = text_conf.get("color", "#000000")
                        line_spacing = text_conf.get("line_spacing", fontsize + 5)
                        alignment = text_conf.get("alignment", "left")  # NEW! Alignment option
                        
                        if font:
                            draw.font = font
                        draw.fill_color = Color(text_color)
                        draw.font_size = fontsize
                        
                        if key in ["options"]:
                            if isinstance(slide_data[key], dict):
                                text = "<break>".join(f"{num}: {sanitize_text(item)}" for num, item in slide_data[key].items())
                            else:
                                text = "<break>".join(f"{num}: {sanitize_text(item)}" for num, item in enumerate(slide_data[key], start=1))
                        elif key in ["points"]:
                            if isinstance(slide_data[key], dict):
                                text = "<break>".join(f"- {sanitize_text(item)}" for key, item in slide_data[key].items())
                            else:
                                text = "<break>".join(f"- {sanitize_text(item)}" for item in slide_data[key])
                        else:
                            if isinstance(slide_data[key], str):
                                text = sanitize_text(slide_data[key])
                            else:
                                text = "<break>".join(sanitize_text(item) for item in slide_data[key])

                        if key == "title":
                            fixed_pos = text_conf.get("position", [100, 100])  # Default if missing
                            _unused, y_offset = fixed_pos  # Keep title's fixed Y position

                            y_offset += 20  # Add some spacing before the next element

                        if key in ["content", "title", "subtitle", "explanation"]:  # Wrap text for 'content', 'title', 'subtitle', 'points', and 'options'
                            lines, consumed_height = wrap_text(draw, text, max_width, fontsize, line_spacing)
                        elif key in ["points", "options"]:
                            line = text.split("<break>")
                            lines = []
                            for l in line:
                                wrapped_lines, consumed_height = wrap_text(draw, l, max_width, fontsize, line_spacing)
                                lines.extend(wrapped_lines)
                        else:
                            lines = text.split("\n")

                        # print(lines)
                        
                        for line in lines:
                            if alignment == "center":
                                line_metrics = draw.get_font_metrics(WandImage(width=1, height=1), line)
                                x_pos = int((width - line_metrics.text_width) / 2)  # Center align each line
                            else:
                                x_pos = 100  # Left align by default
                        
                            draw.text(x_pos, y_offset, line)
                            y_offset += line_spacing  # Move down to next line


                        # Add spacing after each section
                        y_offset += 20

                if "formula" in slide_data and "formula" in config:
                    formula_text = slide_data["formula"]
                    formatter = ImageFormatter(style='monokai', image_pad=17, line_pad=10, font_size=34, image_width=1000, image_height=1000)
                    if len(formula_text) < 100:
                        formatter.font_size = 37
                    if len(formula_text) > 200:
                        formatter.font_size = 27
                    formula_snippet_path = "formula.png"
                    highlight(formula_text, MathematicaLexer(), formatter, outfile=formula_snippet_path)
                    # Load the code snippet image
                    with WandImage(filename=formula_snippet_path) as formula_snippet:
                        formula_conf = config["formula"]
                        slide_width = config["slide_size"][0]
                        formula_width = formula_snippet.width
                        formula_pos = [(slide_width - formula_width) // 2, y_offset]
                        img.composite(formula_snippet, left=formula_pos[0], top=formula_pos[1])

                elif "code" in slide_data and "code" in config:
                    code_text = slide_data["code"]
                    formatter = ImageFormatter(style='monokai', image_pad=17, line_pad=10, font_size=26, image_width=1000, image_height=1000)
                    if len(code_text) < 100:
                        formatter.font_size = 32
                    if len(code_text) > 200:
                        formatter.font_size = 22
                    code_snippet_path = "code.png"
                    lexer = slide_data.get("lexer", 'bash')  # Replace None with a default value if needed
                    if lexer == "python":
                        highlight(code_text, PythonLexer(), formatter, outfile=code_snippet_path)
                    elif lexer == "java":
                        highlight(code_text, JavaLexer(), formatter, outfile=code_snippet_path)
                    elif lexer == "mathematics":
                        highlight(code_text, MathematicaLexer(), formatter, outfile=code_snippet_path)
                    elif lexer == "cpp":
                        highlight(code_text, CppLexer(), formatter, outfile=code_snippet_path)
                    elif lexer == "c":
                        highlight(code_text, CSharpLexer(), formatter, outfile=code_snippet_path)
                    elif lexer == "html":
                        highlight(code_text, HtmlLexer(), formatter, outfile=code_snippet_path)
                    elif lexer == "css":
                        highlight(code_text, CssLexer(), formatter, outfile=code_snippet_path)
                    elif lexer == "javascript":
                        highlight(code_text, JavascriptLexer(), formatter, outfile=code_snippet_path)
                    elif lexer == "json":
                        highlight(code_text, JsonLexer(), formatter, outfile=code_snippet_path)
                    elif lexer == "yaml":
                        highlight(code_text, YamlLexer(), formatter, outfile=code_snippet_path)
                    elif lexer == "bash":
                        highlight(code_text, BashLexer(), formatter, outfile=code_snippet_path)
                    elif lexer == "perl":
                        highlight(code_text, PerlLexer(), formatter, outfile=code_snippet_path)
                    elif lexer == "php":
                        highlight(code_text, PhpLexer(), formatter, outfile=code_snippet_path)
                    elif lexer == "ruby":
                        highlight(code_text, RubyLexer(), formatter, outfile=code_snippet_path)
                    elif lexer == "sql":
                        highlight(code_text, SqlLexer(), formatter, outfile=code_snippet_path)

                    # Load the code snippet image
                    with WandImage(filename=code_snippet_path) as code_snippet:
                        code_conf = config["code"]
                        code_pos = code_conf.get("position", [100, 100])
                        img.composite(code_snippet, left=code_pos[0], top=code_pos[1])

                draw(img)

                if slide_type == "chart_slide":
                    chart_path = output_path.replace(".png", "_chart.png")
                    generate_chart_image(slide_data, chart_path, template)
                    with WandImage(filename=chart_path) as chart_img:
                        chart_img.resize(1200, 800)  # Ensure chart fits properly
                        chart_pos = config.get("chart", {}).get("position", [400, 200])
                        img.composite(chart_img, left=chart_pos[0], top=chart_pos[1])


            img.format = 'png'
            img.save(filename=output_path)

def generate_audio(text, filename):
    try:
        clean_text = sanitize_text(text)

        # Initialize the Azure client
        # Set either the `SpeechSynthesisVoiceName` or `SpeechSynthesisLanguage`.
        speech_config.speech_synthesis_language = "en-IN" 
        speech_config.speech_synthesis_voice_name ="en-IN-ArjunNeural"
        audio_config = speechsdk.audio.AudioOutputConfig(filename=filename)
        speech_synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=audio_config)
        speech_synthesis_result = speech_synthesizer.speak_text_async(clean_text).get()
        
    except Exception as e:
        print("Error generating audio with Azure TTS: %s", e)
        raise


def process_slide(slide_data, template, output_dir):
    """
    Process an individual slide: create image, generate audio, and combine them into a video clip.
    """
    slide_number = slide_data.get("slideNumber", 1)
    slide_type = slide_data.get("type", "content_slide")

    image_path = os.path.join(output_dir, f"slide_{slide_number}.png")
    audio_path = os.path.join(output_dir, f"audio_{slide_number}.mp3")

    generated_image_path = os.path.join(output_dir, f"gemini-native-image_slide{slide_number}.png")

    # Check if imagePrompt and imageRatio are present for image generation
    image_prompt = slide_data.get("imagePrompt")
    image_ratio = slide_data.get("imageRatio")

    if image_prompt and image_ratio:
        # Donot generate image if the image is already present
        if os.path.exists(generated_image_path):
            logging.info(f"Image for slide {slide_number} already exists. Skipping generation.")
        else:
            logging.info(f"Generating image for slide {slide_number} with prompt: '{image_prompt}' and ratio: {image_ratio}")
            command = ["node", "src/ai/flows/generate-image.js", "--generate-image", f"'{image_prompt}'", image_ratio, str(slide_number)]
            print(command)
            try:
                subprocess.run(command, check=True, capture_output=True, text=True)
                logging.info(f"Successfully generated image for slide {slide_number}.")
            except subprocess.CalledProcessError as e:
                logging.error(f"Error generating image for slide {slide_number}: {e.stderr}")

    # Generate the base slide image (text, code, charts etc.)
    generate_slide_image(slide_data, template, image_path) # This still generates the base image
    voice_text = slide_data.get("voiceover", slide_data.get("content", ""))
    generate_audio(voice_text, audio_path)

    audio_clip = AudioFileClip(audio_path)
    clip_duration = audio_clip.duration
    slide_clip = ImageClip(image_path).set_duration(clip_duration)
    video_clip = slide_clip.set_audio(audio_clip)

    # If a generative image was created, overlay it on the base slide
    if os.path.exists(generated_image_path):  # Check if the generative image exists
        if slide_type == "title_slide":
            # Set the generated image as the background for title slides
            gen_image_clip = ImageClip(generated_image_path).set_duration(clip_duration).resize(newsize=slide_clip.size)
            gen_image_clip = gen_image_clip.set_position(('center', 'center'))  # Center the image
            # Overlay the title slide textual content on top of the generated image
            slide_clip = slide_clip.set_position(('center', 'center'))  # Center the text
            slide_clip = slide_clip.set_opacity(0.9)  # Make the text slightly transparent
            video_clip = CompositeVideoClip([gen_image_clip, slide_clip]).set_duration(clip_duration).set_audio(audio_clip)
        else:
            # Resize and position the generated image below all text content for other slide types
            with WandImage(filename=generated_image_path) as gen_image:
                # Get slide dimensions
                slide_width, slide_height = slide_clip.size
                
                # We need to calculate the total height of the text content to place the image below it.
                # This requires re-parsing the slide content and calculating heights similar to generate_slide_image
                # For simplicity in this diff, we'll use a fixed offset after a calculated approximate text height.
                # A more robust solution would re-use the text rendering logic to get the exact final Y position.
                approx_text_height = 100

                # Debugging: Print slide_data to verify the content key
                print("slide_data:", slide_data)

                from PIL import Image

                for key in ["title", "subtitle", "content", "question", "options", "points", "explanation"]:
                    if key in slide_data and key in template[slide_type]:
                        text_conf = template[slide_type][key]
                        fontsize = text_conf.get("font_size", int(text_conf.get("scale", 1.0) * 30))
                        line_spacing = text_conf.get("line_spacing", fontsize + 5)
                        
                        # Debugging: Print the key and its calculated height
                        print(f"Processing key: {key}, fontsize: {fontsize}, line_spacing: {line_spacing}")
                        
                        if isinstance(slide_data[key], list):
                            # Join the list into a single string with newline separators
                            text_content = "\n".join(slide_data[key])
                        elif isinstance(slide_data[key], str):
                            # Use the string as-is
                            text_content = slide_data[key]
                        else:
                            # Handle unexpected types
                            raise TypeError(f"Unexpected type for slide_data[{key}]: {type(slide_data[key])}")

                        # Calculate the approximate text height
                        for line in text_content.split("\n"):
                            if line.endswith(".png"):  # Check if the line contains an image reference
                                try:
                                    # Open the image and get its height
                                    with Image.open(line) as img:
                                        image_height = img.height
                                        approx_text_height += image_height
                                        print(f"Adding image height for {line}: {image_height}")
                                except FileNotFoundError:
                                    print(f"Image file not found: {line}")
                                    raise
                            else:
                                # Add height for text
                                approx_text_height += line_spacing + 20

                # Debugging: Print the final calculated height
                print("Final approx_text_height:", approx_text_height)
              
                image_y_pos = approx_text_height + 60 # Position below approximate text content
                gen_image_clip = ImageClip(generated_image_path).set_duration(clip_duration).resize(width=slide_clip.w * 0.6).set_position(('center', image_y_pos)) # Resize and center horizontally
                video_clip = CompositeVideoClip([slide_clip, gen_image_clip]).set_duration(clip_duration).set_audio(audio_clip)
                
                # Calculate available vertical space for the image below the text
                available_height = slide_height - image_y_pos
                
                # Resize the image to fit within the available space while maintaining aspect ratio
                original_aspect_ratio = gen_image.width / gen_image.height
                
                if gen_image.height > available_height:
                    new_height = available_height * 0.7
                    new_width = int(new_height * original_aspect_ratio)
                    gen_image_clip = ImageClip(generated_image_path).set_duration(clip_duration).resize(height=new_height)
                
                # Position the resized image below the text with a gap, centered horizontally
                gen_image_clip = gen_image_clip.set_position(('center', image_y_pos))
                video_clip = CompositeVideoClip([slide_clip, gen_image_clip]).set_duration(clip_duration).set_audio(audio_clip)
    return video_clip

# --- Main Execution ---
def main(script_input_path, video_output_path, assets_dir):
    """Main function to generate the video."""
    logging.info("Starting video generation process...")
    logging.info(f"Input script JSON: {script_input_path}")
    logging.info(f"Output video path: {video_output_path}")
    logging.info(f"Assets directory: {assets_dir}")

    # --- Load Inputs ---
    try:
        with open(script_input_path, "r", encoding='utf-8') as f:
            course_script = json.load(f)
        logging.info("Course script loaded successfully.")
    except Exception as e:
        logging.error(f"Error loading course script from {script_input_path}: {e}")
        sys.exit(1)

    template_path = os.path.join(os.path.dirname(__file__), '..', '..', DEFAULT_TEMPLATE_PATH) # Assume template in project root
    try:
        with open(template_path, "r", encoding='utf-8') as f:
            template = json.load(f)
        logging.info(f"Template loaded successfully from {template_path}")
    except Exception as e:
        logging.error(f"Error loading template from {template_path}: {e}")
        sys.exit(1)

    # --- Process Slides ---
    slides = course_script.get("slides", [])
    if not slides:
        logging.error("No slides found in the course script.")
        sys.exit(1)

    clips = []
    transitions = []
    slide_type = []
    output_dir = os.path.dirname(video_output_path)

    for i, slide in enumerate(course_script.get("slides", [])):
        clip = process_slide(slide, template, assets_dir)
        logging.info(f"Successfully generated {len(clips)} individual slide clips.")

        transition = slide.get("transition", "slide_left")
        type_slide = slide.get("type", "content_slide")
        print(f"Adding slide {i+1} with transition: {transition}")
        transitions.append(transition)
        slide_type.append(type_slide)
        clips.append(clip)
    
    length = len(clips)
    
    for i in range(length-1, 0, -1):
        clip = apply_transition(clips[i-1], clips[i], transition_type=transitions[i-1], duration=1.7)
        if slide_type[i] == "unordered_list_slide" and slide_type[i-1] == "unordered_list_slide":
            clip = concatenate_videoclips([clips[i-1], clips[i]])
        clips.pop()
        clips.pop()
        clips.append(clip)
    
    if not clips:
        st.error("No slides were processed successfully.")
        return
    
    final_video = clips[0]
    output_path =  video_output_path
    
    logging.info(f"Writing final video to {video_output_path}...")
    final_video.write_videofile(output_path, fps=24, logger=None)
    logging.info("Final video written successfully!")

    # Remove the temp_assets folder if present
    if os.path.exists(assets_dir):
        for filename in os.listdir(assets_dir):
            if filename =='final_course.mp4':
                continue
            file_path = os.path.join(assets_dir, filename)
            try:
                if os.path.isfile(file_path):
                    os.remove(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
            except Exception as e:
                logging.error(f"Error deleting {file_path}: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python generate_video.py <input_json_path> <output_video_path> <assets_dir_path>")
        sys.exit(1)

    input_json = sys.argv[1]
    output_video = sys.argv[2]
    assets_directory = sys.argv[3]

    # Ensure assets directory exists
    os.makedirs(assets_directory, exist_ok=True)

    main(input_json, output_video, assets_directory)
