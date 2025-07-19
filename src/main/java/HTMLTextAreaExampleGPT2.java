import javax.swing.*;
public class HTMLTextAreaExampleGPT2 {
    public static void main(String[] args) {
        // Tworzenie ramki
        JFrame frame = new JFrame("Renderowany HTML");
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setSize(400, 200);

        // HTML do wyświetlenia
        String htmlContent = "<html>"
                + "<body>"
                + "<h1 style='color:red;'><b>Hello World!</b></h1>"
                + "</body>"
                + "</html>";

        // Tworzenie JEditorPane do renderowania HTML
        JEditorPane editorPane = new JEditorPane("text/html", htmlContent);
        editorPane.setEditable(false); // wyłącz edycję

        // Umieszczenie w JScrollPane, żeby działało przewijanie
        JScrollPane scrollPane = new JScrollPane(editorPane);

        // Dodanie do ramki
        frame.getContentPane().add(scrollPane);
        frame.setVisible(true);
    }
}
