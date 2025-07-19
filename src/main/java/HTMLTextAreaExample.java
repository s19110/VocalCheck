import javax.swing.*;
import javax.swing.text.html.HTMLEditorKit;
import javax.swing.text.html.StyleSheet;
import java.awt.*;

public class HTMLTextAreaExample {
    public static void main(String[] args) {
        // Tworzenie ramki
        JFrame frame = new JFrame("HTML in JEditorPane Example");
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setSize(400, 300);

        // Tworzenie JEditorPane
        JEditorPane editorPane = new JEditorPane();
        editorPane.setContentType("text/html");
        editorPane.setEditable(false);

        // Dodanie stylu CSS
        HTMLEditorKit editorKit = new HTMLEditorKit();
        editorPane.setEditorKit(editorKit);
        StyleSheet styleSheet = editorKit.getStyleSheet();
        styleSheet.addRule("h1 { color: red; font-weight: bold; }");

        // Ustawienie zawartości HTML
        String htmlText = "<html><body><h1>Hello World!</h1></body></html>";
        editorPane.setText(htmlText);

        // Dodanie JEditorPane do ramki
        frame.add(new JScrollPane(editorPane), BorderLayout.CENTER);

        // Wyświetlenie ramki
        frame.setVisible(true);
    }
}
